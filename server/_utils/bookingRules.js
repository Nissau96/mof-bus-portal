const ACCRA_TIMEZONE = "Africa/Accra";

const PRIVILEGED_BOOKING_OPEN_TIME = "16:00:00";
const PRIVILEGED_BOOKING_CLOSE_TIME = "16:25:00";
const REGULAR_BOOKING_RELEASE_TIME = "16:30:00";

function normalizeTime(timeValue) {
  if (!timeValue) {
    return "";
  }

  const value = String(timeValue);

  if (value.length === 5) {
    return `${value}:00`;
  }

  return value.slice(0, 8);
}

export function formatTimeLabel(timeValue) {
  if (!timeValue) {
    return "";
  }

  const [hours, minutes] = String(timeValue).split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getAccraDateTimeParts() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ACCRA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const values = parts.reduce((accumulator, part) => {
    accumulator[part.type] = part.value;
    return accumulator;
  }, {});

  return {
    dateISO: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
    time: `${values.hour}:${values.minute}:${values.second}`,
  };
}

async function checkPrivilegedUser({ supabase, userProfile }) {
  const profileId = String(userProfile?.id || "").trim();
  const staffId = String(userProfile?.staff_id || "").trim();

  if (!profileId && !staffId) {
    return false;
  }

  let query = supabase.from("privileged_users").select("id").limit(1);

  if (profileId && staffId) {
    query = query.or(`profile_id.eq.${profileId},staff_id.eq.${staffId}`);
  } else if (profileId) {
    query = query.eq("profile_id", profileId);
  } else {
    query = query.eq("staff_id", staffId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

function getUserPriorityRank({ role, isPrivilegedUser }) {
  if (isPrivilegedUser) {
    return 1;
  }

  if (role === "staff" || role === "admin") {
    return 2;
  }

  if (role === "intern_nsp") {
    return 3;
  }

  return 4;
}

/**
 * Checks whether booking is currently allowed.
 *
 * Rules:
 * - No weekend booking
 * - No public holiday booking
 * - Privileged users get early access from 4:00 PM to 4:25 PM
 * - 4:25 PM to 4:29 PM is a release buffer
 * - Unused privileged slots are released from 4:30 PM
 * - From 4:30 PM, staff and NSP/Intern users can both book immediately
 * - Priority metadata is returned for downstream ticket allocation/reporting
 * - Booking closes after system_settings.departure_end_time
 */
export async function getBookingAvailability({ supabase, userProfile = null }) {
  const { dateISO, weekday, time } = getAccraDateTimeParts();

  const { data: settings, error: settingsError } = await supabase
    .from("system_settings")
    .select(
      "id, bus_capacity, booking_open_time, departure_start_time, departure_end_time"
    )
    .eq("id", 1)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const departureStartTime = normalizeTime(
    settings?.departure_start_time || "16:45:00"
  );

  const departureEndTime = normalizeTime(
    settings?.departure_end_time || "17:00:00"
  );

  const { data: holiday, error: holidayError } = await supabase
    .from("public_holidays")
    .select("id, holiday_date, observed_date, base_date, name")
    .or(`observed_date.eq.${dateISO},holiday_date.eq.${dateISO}`)
    .maybeSingle();

  if (holidayError) {
    throw new Error(holidayError.message);
  }

  const isPrivilegedUser = await checkPrivilegedUser({
    supabase,
    userProfile,
  });

  const userRole = userProfile?.role || "";
  const isInternOrNsp = userRole === "intern_nsp";
  const priorityRank = getUserPriorityRank({
    role: userRole,
    isPrivilegedUser,
  });

  const isWeekend = weekday === "Sat" || weekday === "Sun";
  const isPublicHoliday = Boolean(holiday);
  const isAfterDepartureWindow = time > departureEndTime;

  const isWithinPrivilegedWindow =
    isPrivilegedUser &&
    time >= PRIVILEGED_BOOKING_OPEN_TIME &&
    time <= PRIVILEGED_BOOKING_CLOSE_TIME;

  const isWithinReleaseBuffer =
    time > PRIVILEGED_BOOKING_CLOSE_TIME &&
    time < REGULAR_BOOKING_RELEASE_TIME;

  const isWithinRegularWindow = time >= REGULAR_BOOKING_RELEASE_TIME;

  let bookingStatus;
  let reason;
  let bookingWindowType = "regular";

  if (isWeekend) {
    bookingStatus = "Closed";
    reason = "Booking is closed on weekends.";
  } else if (isPublicHoliday) {
    bookingStatus = "Closed";
    reason = `Booking is closed because today is a public holiday: ${holiday.name}.`;
  } else if (isAfterDepartureWindow) {
    bookingStatus = "Closed";
    reason = "Booking is closed because the departure window has ended.";
  } else if (isWithinPrivilegedWindow) {
    bookingStatus = "Open";
    bookingWindowType = "privileged";
    reason = "";
  } else if (isWithinReleaseBuffer) {
    bookingStatus = "Closed";
    bookingWindowType = "release_buffer";
    reason = `Privileged booking has closed. Remaining seats will be released at ${formatTimeLabel(
      REGULAR_BOOKING_RELEASE_TIME
    )}.`;
  } else if (isWithinRegularWindow) {
    bookingStatus = "Open";
    bookingWindowType =
      isInternOrNsp && !isPrivilegedUser
        ? "regular_intern_nsp"
        : "regular_priority";
    reason = "";
  } else {
    bookingStatus = "Closed";

    if (isPrivilegedUser) {
      reason = `Privileged booking opens at ${formatTimeLabel(
        PRIVILEGED_BOOKING_OPEN_TIME
      )}. Remaining seats are released at ${formatTimeLabel(
        REGULAR_BOOKING_RELEASE_TIME
      )}.`;
    } else {
      reason = `Booking opens at ${formatTimeLabel(
        REGULAR_BOOKING_RELEASE_TIME
      )}.`;
    }
  }

  const departureStart = formatTimeLabel(departureStartTime);
  const departureEnd = formatTimeLabel(departureEndTime);

  return {
    dateISO,
    currentTime: time,
    bookingStatus,
    reason,
    canBook: bookingStatus === "Open",
    capacity: settings?.bus_capacity || 36,
    bookingOpenTime: REGULAR_BOOKING_RELEASE_TIME,
    departureStartTime,
    departureEndTime,
    privilegedBookingOpenTime: PRIVILEGED_BOOKING_OPEN_TIME,
    privilegedBookingCloseTime: PRIVILEGED_BOOKING_CLOSE_TIME,
    bookingOpenTimeLabel: formatTimeLabel(REGULAR_BOOKING_RELEASE_TIME),
    privilegedBookingWindowLabel: `${formatTimeLabel(
      PRIVILEGED_BOOKING_OPEN_TIME
    )} - ${formatTimeLabel(PRIVILEGED_BOOKING_CLOSE_TIME)}`,
    departureWindow:
      departureStart && departureEnd
        ? `${departureStart} - ${departureEnd}`
        : "4:45 PM - 5:00 PM",
    holiday,
    isPrivilegedUser,
    bookingWindowType,
    isInternOrNsp,
    priorityRank,
  };
}
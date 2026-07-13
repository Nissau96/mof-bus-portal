const ACCRA_TIMEZONE = "Africa/Accra";

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

/**
 * Checks whether booking is currently allowed.
 *
 * Rules:
 * - No weekend booking
 * - No public holiday booking
 * - Booking opens at system_settings.booking_open_time
 * - Booking closes after system_settings.departure_end_time
 */
export async function getBookingAvailability({ supabase }) {
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

  const bookingOpenTime = normalizeTime(settings?.booking_open_time || "16:20:00");
  const departureStartTime = normalizeTime(
    settings?.departure_start_time || "16:45:00"
  );
  const departureEndTime = normalizeTime(
    settings?.departure_end_time || "17:00:00"
  );

  const { data: holiday, error: holidayError } = await supabase
    .from("public_holidays")
    .select("id, holiday_date, name")
    .eq("holiday_date", dateISO)
    .maybeSingle();

  if (holidayError) {
    throw new Error(holidayError.message);
  }

  const isWeekend = weekday === "Sat" || weekday === "Sun";
  const isPublicHoliday = Boolean(holiday);
  const isBeforeBookingOpen = time < bookingOpenTime;
  const isAfterDepartureWindow = time > departureEndTime;

  let bookingStatus = "Open";
  let reason = "";

  if (isWeekend) {
    bookingStatus = "Closed";
    reason = "Booking is closed on weekends.";
  } else if (isPublicHoliday) {
    bookingStatus = "Closed";
    reason = `Booking is closed because today is a public holiday: ${holiday.name}.`;
  } else if (isBeforeBookingOpen) {
    bookingStatus = "Closed";
    reason = `Booking opens at ${formatTimeLabel(bookingOpenTime)}.`;
  } else if (isAfterDepartureWindow) {
    bookingStatus = "Closed";
    reason = "Booking is closed because the departure window has ended.";
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
    bookingOpenTime,
    departureStartTime,
    departureEndTime,
    bookingOpenTimeLabel: formatTimeLabel(bookingOpenTime),
    departureWindow:
      departureStart && departureEnd
        ? `${departureStart} - ${departureEnd}`
        : "4:45 PM - 5:00 PM",
    holiday,
  };
}
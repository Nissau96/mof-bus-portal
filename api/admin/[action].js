import { requireAdmin } from "../../server/_utils/requireAdmin.js";
import { getAccraDateTimeParts } from "../../server/_utils/bookingRules.js";
import { generateGhanaPublicHolidays } from "../../server/_utils/ghanaHolidays.js";

function setNoStoreHeaders(res) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}

function getAction(req) {
  const queryAction = req.query?.action;

  if (Array.isArray(queryAction)) {
    return queryAction[0];
  }

  if (queryAction) {
    return queryAction;
  }

  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const parts = url.pathname.split("/").filter(Boolean);

  return parts[parts.length - 1] || "";
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function buildManifestCsv(rows) {
  const headers = [
    "Ticket Number",
    "Full Name",
    "Role",
    "Staff ID",
    "Email",
    "Phone",
    "Division",
    "Bus Route",
    "Drop-off Location",
    "Travel Date",
    "Status",
  ];

  const csvRows = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      [
        row.ticket_number ? String(row.ticket_number).padStart(2, "0") : "",
        row.profile?.full_name || "",
        row.profile?.role || "",
        row.profile?.staff_id || "",
        row.profile?.email || "",
        row.profile?.phone || "",
        row.profile?.division || "",
        row.bus_route || "",
        row.dropoff_location || "",
        row.travel_date || "",
        row.status || "",
      ]
        .map(escapeCsvValue)
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}

function formatTimeLabel(timeValue) {
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

async function handleArchiveTickets(req, res, auth) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  const { user: adminUser, supabase } = auth;
  const { dateISO: today } = getAccraDateTimeParts();

  const { count: oldTicketsCount, error: oldTicketsCountError } =
    await supabase
      .from("daily_tickets")
      .select("*", { count: "exact", head: true })
      .lt("travel_date", today);

  if (oldTicketsCountError) {
    return res.status(500).json({
      message: oldTicketsCountError.message,
    });
  }

  const { count: oldWaitingCount, error: oldWaitingCountError } = await supabase
    .from("waiting_list")
    .select("*", { count: "exact", head: true })
    .lt("travel_date", today);

  if (oldWaitingCountError) {
    return res.status(500).json({
      message: oldWaitingCountError.message,
    });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      today,
      oldTicketsCount: oldTicketsCount || 0,
      oldWaitingCount: oldWaitingCount || 0,
    });
  }

  const { data: oldTickets, error: oldTicketsError } = await supabase
    .from("daily_tickets")
    .select(
      "id, user_id, travel_date, ticket_number, dropoff_location, status, bus_route"
    )
    .lt("travel_date", today)
    .order("travel_date", { ascending: true })
    .order("ticket_number", { ascending: true });

  if (oldTicketsError) {
    return res.status(500).json({
      message: oldTicketsError.message,
    });
  }

  const archivePayload = (oldTickets || []).map((ticket) => ({
    original_ticket_id: ticket.id,
    user_id: ticket.user_id,
    travel_date: ticket.travel_date,
    ticket_number: ticket.ticket_number,
    dropoff_location: ticket.dropoff_location,
    status: ticket.status,
    bus_route: ticket.bus_route,
    archived_at: new Date().toISOString(),
  }));

  let archivedCount = 0;

  if (archivePayload.length > 0) {
    const { data: archivedRecords, error: archiveError } = await supabase
      .from("archived_tickets")
      .upsert(archivePayload, {
        onConflict: "original_ticket_id",
      })
      .select("id");

    if (archiveError) {
      return res.status(500).json({
        message: archiveError.message,
      });
    }

    archivedCount = archivedRecords?.length || 0;
  }

  const { error: deleteTicketsError } = await supabase
    .from("daily_tickets")
    .delete()
    .lt("travel_date", today);

  if (deleteTicketsError) {
    return res.status(500).json({
      message: deleteTicketsError.message,
    });
  }

  const { error: deleteWaitingError } = await supabase
    .from("waiting_list")
    .delete()
    .lt("travel_date", today);

  if (deleteWaitingError) {
    return res.status(500).json({
      message: deleteWaitingError.message,
    });
  }

  await supabase.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "admin_archived_old_tickets",
    details: {
      today,
      old_tickets_found: oldTicketsCount || 0,
      old_waiting_records_found: oldWaitingCount || 0,
      archived_count: archivedCount,
    },
  });

  return res.status(200).json({
    message: "Old ticket records have been archived successfully.",
    today,
    oldTicketsFound: oldTicketsCount || 0,
    oldWaitingRecordsFound: oldWaitingCount || 0,
    archivedCount,
  });
}

async function handleAuditLogs(req, res, auth) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const { supabase } = auth;

  const { data: logs, error: logsError } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, details, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (logsError) {
    return res.status(500).json({
      message: logsError.message,
    });
  }

  const userIds = (logs || []).map((log) => log.user_id).filter(Boolean);
  const uniqueUserIds = [...new Set(userIds)];

  let profilesById = {};

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, staff_id, division")
      .in("id", uniqueUserIds);

    if (profilesError) {
      return res.status(500).json({
        message: profilesError.message,
      });
    }

    profilesById = (profiles || []).reduce((accumulator, profile) => {
      accumulator[profile.id] = profile;
      return accumulator;
    }, {});
  }

  const logsWithProfiles = (logs || []).map((log) => ({
    ...log,
    profile: profilesById[log.user_id] || null,
  }));

  const actions = [
    ...new Set((logs || []).map((log) => log.action).filter(Boolean)),
  ].sort();

  return res.status(200).json({
    logs: logsWithProfiles,
    actions,
  });
}

async function handleBookingHistory(req, res, auth) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const { supabase } = auth;

  const { data: archivedTickets, error: archivedError } = await supabase
    .from("archived_tickets")
    .select(
      "id, original_ticket_id, user_id, travel_date, ticket_number, bus_route, dropoff_location, status, archived_at"
    )
    .order("travel_date", { ascending: false })
    .order("archived_at", { ascending: false })
    .limit(500);

  if (archivedError) {
    return res.status(500).json({
      message: archivedError.message,
    });
  }

  const userIds = (archivedTickets || [])
    .map((ticket) => ticket.user_id)
    .filter(Boolean);

  const uniqueUserIds = [...new Set(userIds)];

  let profilesById = {};

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled"
      )
      .in("id", uniqueUserIds);

    if (profilesError) {
      return res.status(500).json({
        message: profilesError.message,
      });
    }

    profilesById = (profiles || []).reduce((accumulator, profile) => {
      accumulator[profile.id] = profile;
      return accumulator;
    }, {});
  }

  const records = (archivedTickets || []).map((ticket) => ({
    ...ticket,
    profile: profilesById[ticket.user_id] || null,
  }));

  return res.status(200).json({
    records,
  });
}

async function handleManifest(req, res, auth) {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  const { supabase } = auth;
  const { dateISO: today } = getAccraDateTimeParts();

  const requestedDate = String(req.query.date || today).trim();
  const format = String(req.query.format || "json").trim().toLowerCase();
  const requestedBusRoute = String(req.query.busRoute || "all").trim();

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(requestedDate)) {
    return res.status(400).json({
      message: "Date must be in YYYY-MM-DD format.",
    });
  }

  let ticketsQuery = supabase
    .from("daily_tickets")
    .select(
      "id, user_id, travel_date, ticket_number, bus_route, dropoff_location, status"
    )
    .eq("travel_date", requestedDate)
    .eq("status", "confirmed")
    .order("bus_route", { ascending: true })
    .order("ticket_number", { ascending: true });

  if (requestedBusRoute !== "all") {
    ticketsQuery = ticketsQuery.eq("bus_route", requestedBusRoute);
  }

  const { data: tickets, error: ticketsError } = await ticketsQuery;

  if (ticketsError) {
    return res.status(500).json({
      message: ticketsError.message,
    });
  }

  const userIds = (tickets || []).map((ticket) => ticket.user_id).filter(Boolean);
  const uniqueUserIds = [...new Set(userIds)];

  let profilesById = {};

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled"
      )
      .in("id", uniqueUserIds);

    if (profilesError) {
      return res.status(500).json({
        message: profilesError.message,
      });
    }

    profilesById = (profiles || []).reduce((accumulator, profile) => {
      accumulator[profile.id] = profile;
      return accumulator;
    }, {});
  }

  const manifest = (tickets || []).map((ticket) => ({
    ...ticket,
    profile: profilesById[ticket.user_id] || null,
  }));

  if (format === "csv") {
    const csv = buildManifestCsv(manifest);
    const routeSlug =
      requestedBusRoute === "all"
        ? "all-routes"
        : requestedBusRoute.toLowerCase().replaceAll(" ", "-");

    const filename = `mof-bus-manifest-${requestedDate}-${routeSlug}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.status(200).send(csv);
  }

  return res.status(200).json({
    travelDate: requestedDate,
    busRoute: requestedBusRoute,
    count: manifest.length,
    manifest,
  });
}

async function handlePrivilegedUsers(req, res, auth) {
  const { user: adminUser, supabase } = auth;

  if (req.method === "GET") {
    const { data: privilegedUsers, error: privilegedError } = await supabase
      .from("privileged_users")
      .select("id, staff_id, created_at")
      .order("created_at", { ascending: false });

    if (privilegedError) {
      return res.status(500).json({
        message: privilegedError.message,
      });
    }

    const staffIds = (privilegedUsers || [])
      .map((record) => record.staff_id)
      .filter(Boolean);

    let profilesByStaffId = {};

    if (staffIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled"
        )
        .in("staff_id", staffIds);

      if (profilesError) {
        return res.status(500).json({
          message: profilesError.message,
        });
      }

      profilesByStaffId = (profiles || []).reduce((accumulator, profile) => {
        accumulator[profile.staff_id] = profile;
        return accumulator;
      }, {});
    }

    const records = (privilegedUsers || []).map((record) => ({
      ...record,
      profile: profilesByStaffId[record.staff_id] || null,
    }));

    return res.status(200).json({
      privilegedUsers: records,
    });
  }

  if (req.method === "POST") {
    const { staffId } = req.body || {};
    const cleanedStaffId = String(staffId || "").trim();

    if (!cleanedStaffId) {
      return res.status(400).json({
        message: "Staff ID is required.",
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, staff_id, is_disabled")
      .eq("staff_id", cleanedStaffId)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        message: profileError.message,
      });
    }

    if (!profile) {
      return res.status(404).json({
        message:
          "No registered staff profile was found with this Staff ID. Register the staff user first.",
      });
    }

    if (profile.role !== "staff" && profile.role !== "admin") {
      return res.status(400).json({
        message: "Only staff or admin accounts can be added as privileged users.",
      });
    }

    const { data: privilegedUser, error: insertError } = await supabase
      .from("privileged_users")
      .insert({
        staff_id: cleanedStaffId,
      })
      .select("id, staff_id, created_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({
          message: "This Staff ID is already on the privileged users list.",
        });
      }

      return res.status(500).json({
        message: insertError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: adminUser.id,
      action: "admin_added_privileged_user",
      details: {
        staff_id: cleanedStaffId,
        target_user_id: profile.id,
        target_full_name: profile.full_name,
        target_email: profile.email,
      },
    });

    return res.status(201).json({
      message: "Privileged user has been added.",
      privilegedUser: {
        ...privilegedUser,
        profile,
      },
    });
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({
        message: "Privileged user record ID is required.",
      });
    }

    const { data: existingRecord, error: existingError } = await supabase
      .from("privileged_users")
      .select("id, staff_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({
        message: existingError.message,
      });
    }

    if (!existingRecord) {
      return res.status(404).json({
        message: "Privileged user record was not found.",
      });
    }

    const { error: deleteError } = await supabase
      .from("privileged_users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(500).json({
        message: deleteError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: adminUser.id,
      action: "admin_removed_privileged_user",
      details: {
        privileged_user_id: existingRecord.id,
        staff_id: existingRecord.staff_id,
      },
    });

    return res.status(200).json({
      message: "Privileged user has been removed.",
      removedId: id,
    });
  }

  return res.status(405).json({
    message: "Method not allowed.",
  });
}

async function handlePublicHolidays(req, res, auth) {
  const { user: adminUser, supabase } = auth;

  if (req.method === "GET") {
    const { data: holidays, error } = await supabase
      .from("public_holidays")
      .select(
        "id, holiday_date, observed_date, base_date, name, holiday_type, source, year, created_at"
      )
      .order("observed_date", { ascending: false })
      .order("holiday_date", { ascending: false });

    if (error) {
      return res.status(500).json({
        message: error.message,
      });
    }

    return res.status(200).json({
      holidays: holidays || [],
    });
  }

  if (req.method === "POST") {
    const { holidayDate, name, year, mode } = req.body || {};

    if (mode === "generate_year") {
      const parsedYear = Number(year);

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 2025 ||
        parsedYear > 2100
      ) {
        return res.status(400).json({
          message: "Enter a valid year between 2025 and 2100.",
        });
      }

      const generatedHolidays = generateGhanaPublicHolidays(parsedYear);

      const { data: holidays, error: upsertError } = await supabase
        .from("public_holidays")
        .upsert(generatedHolidays, {
          onConflict: "observed_date",
        })
        .select(
          "id, holiday_date, observed_date, base_date, name, holiday_type, source, year, created_at"
        );

      if (upsertError) {
        return res.status(500).json({
          message: upsertError.message,
        });
      }

      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "admin_generated_public_holidays",
        details: {
          year: parsedYear,
          generated_count: holidays?.length || 0,
          source: "ghana_holiday_generator",
        },
      });

      return res.status(201).json({
        message: `Ghana public holidays for ${parsedYear} have been generated.`,
        holidays: holidays || [],
      });
    }

    const cleanedDate = String(holidayDate || "").trim();
    const cleanedName = String(name || "").trim();

    if (!cleanedDate) {
      return res.status(400).json({
        message: "Holiday date is required.",
      });
    }

    if (!cleanedName) {
      return res.status(400).json({
        message: "Holiday name is required.",
      });
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(cleanedDate)) {
      return res.status(400).json({
        message: "Holiday date must be in YYYY-MM-DD format.",
      });
    }

    const parsedManualYear = Number(cleanedDate.slice(0, 4));

    const { data: holiday, error: insertError } = await supabase
      .from("public_holidays")
      .insert({
        holiday_date: cleanedDate,
        observed_date: cleanedDate,
        base_date: cleanedDate,
        name: cleanedName,
        holiday_type: "manual",
        source: "admin",
        year: parsedManualYear,
      })
      .select(
        "id, holiday_date, observed_date, base_date, name, holiday_type, source, year, created_at"
      )
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({
          message: "A public holiday already exists for this observed date.",
        });
      }

      return res.status(500).json({
        message: insertError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: adminUser.id,
      action: "admin_added_public_holiday",
      details: {
        holiday_id: holiday.id,
        holiday_date: holiday.holiday_date,
        observed_date: holiday.observed_date,
        base_date: holiday.base_date,
        name: holiday.name,
        holiday_type: holiday.holiday_type,
        source: holiday.source,
        year: holiday.year,
      },
    });

    return res.status(201).json({
      message: "Public holiday has been added.",
      holiday,
    });
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({
        message: "Public holiday ID is required.",
      });
    }

    const { data: existingHoliday, error: existingError } = await supabase
      .from("public_holidays")
      .select(
        "id, holiday_date, observed_date, base_date, name, holiday_type, source, year"
      )
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({
        message: existingError.message,
      });
    }

    if (!existingHoliday) {
      return res.status(404).json({
        message: "Public holiday was not found.",
      });
    }

    const { error: deleteError } = await supabase
      .from("public_holidays")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(500).json({
        message: deleteError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: adminUser.id,
      action: "admin_removed_public_holiday",
      details: {
        holiday_id: existingHoliday.id,
        holiday_date: existingHoliday.holiday_date,
        observed_date: existingHoliday.observed_date,
        base_date: existingHoliday.base_date,
        name: existingHoliday.name,
        holiday_type: existingHoliday.holiday_type,
        source: existingHoliday.source,
        year: existingHoliday.year,
      },
    });

    return res.status(200).json({
      message: "Public holiday has been removed.",
      removedId: id,
    });
  }

  return res.status(405).json({
    message: "Method not allowed.",
  });
}

async function handleSettings(req, res, auth) {
  const { user: adminUser, supabase } = auth;

  if (req.method === "GET") {
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select(
        "id, bus_capacity, departure_start_time, departure_end_time, booking_open_time, updated_at"
      )
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        message: error.message,
      });
    }

    if (!settings) {
      return res.status(404).json({
        message: "System settings record was not found.",
      });
    }

    return res.status(200).json({
      settings,
    });
  }

  if (req.method === "POST") {
    const {
      busCapacity,
      bookingOpenTime,
      departureStartTime,
      departureEndTime,
    } = req.body || {};

    const parsedCapacity = Number(busCapacity);

    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      return res.status(400).json({
        message: "Bus capacity must be a positive whole number.",
      });
    }

    if (parsedCapacity > 200) {
      return res.status(400).json({
        message: "Bus capacity cannot exceed 200.",
      });
    }

    if (!bookingOpenTime || !departureStartTime || !departureEndTime) {
      return res.status(400).json({
        message: "Booking open time and departure times are required.",
      });
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

    if (
      !timePattern.test(bookingOpenTime) ||
      !timePattern.test(departureStartTime) ||
      !timePattern.test(departureEndTime)
    ) {
      return res.status(400).json({
        message: "Times must be in HH:MM or HH:MM:SS format.",
      });
    }

    const normalizedBookingOpenTime =
      bookingOpenTime.length === 5 ? `${bookingOpenTime}:00` : bookingOpenTime;

    const normalizedDepartureStartTime =
      departureStartTime.length === 5
        ? `${departureStartTime}:00`
        : departureStartTime;

    const normalizedDepartureEndTime =
      departureEndTime.length === 5
        ? `${departureEndTime}:00`
        : departureEndTime;

    const { data: currentSettings, error: currentSettingsError } =
      await supabase
        .from("system_settings")
        .select(
          "id, bus_capacity, departure_start_time, departure_end_time, booking_open_time"
        )
        .eq("id", 1)
        .maybeSingle();

    if (currentSettingsError) {
      return res.status(500).json({
        message: currentSettingsError.message,
      });
    }

    const { data: updatedSettings, error: updateError } = await supabase
      .from("system_settings")
      .update({
        bus_capacity: parsedCapacity,
        booking_open_time: normalizedBookingOpenTime,
        departure_start_time: normalizedDepartureStartTime,
        departure_end_time: normalizedDepartureEndTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select(
        "id, bus_capacity, departure_start_time, departure_end_time, booking_open_time, updated_at"
      )
      .single();

    if (updateError) {
      return res.status(500).json({
        message: updateError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: adminUser.id,
      action: "admin_updated_system_settings",
      details: {
        previous_settings: currentSettings,
        new_settings: updatedSettings,
      },
    });

    return res.status(200).json({
      message: "System settings have been updated.",
      settings: updatedSettings,
    });
  }

  return res.status(405).json({
    message: "Method not allowed.",
  });
}

async function handleSummary(req, res, auth) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const { supabase } = auth;
  const today = new Date().toISOString().slice(0, 10);

  const { data: settings, error: settingsError } = await supabase
    .from("system_settings")
    .select("bus_capacity, departure_start_time, departure_end_time")
    .eq("id", 1)
    .maybeSingle();

  if (settingsError) {
    return res.status(500).json({ message: settingsError.message });
  }

  const capacity = settings?.bus_capacity || 36;

  const { count: confirmedCount, error: confirmedError } = await supabase
    .from("daily_tickets")
    .select("*", { count: "exact", head: true })
    .eq("travel_date", today)
    .eq("status", "confirmed");

  if (confirmedError) {
    return res.status(500).json({ message: confirmedError.message });
  }

  const { count: cancelledCount, error: cancelledError } = await supabase
    .from("daily_tickets")
    .select("*", { count: "exact", head: true })
    .eq("travel_date", today)
    .eq("status", "cancelled");

  if (cancelledError) {
    return res.status(500).json({ message: cancelledError.message });
  }

  const { count: waitingCount, error: waitingError } = await supabase
    .from("waiting_list")
    .select("*", { count: "exact", head: true })
    .eq("travel_date", today)
    .eq("status", "waiting");

  if (waitingError) {
    return res.status(500).json({ message: waitingError.message });
  }

  const { count: profileCount, error: profileError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_disabled", false);

  if (profileError) {
    return res.status(500).json({ message: profileError.message });
  }

  const departureStart = formatTimeLabel(settings?.departure_start_time);
  const departureEnd = formatTimeLabel(settings?.departure_end_time);
  const departureWindow =
    departureStart && departureEnd
      ? `${departureStart} - ${departureEnd}`
      : "4:45 PM - 5:00 PM";

  return res.status(200).json({
    travelDate: today,
    capacity,
    confirmedCount: confirmedCount || 0,
    availableSeats: Math.max(capacity - (confirmedCount || 0), 0),
    waitingCount: waitingCount || 0,
    cancelledCount: cancelledCount || 0,
    activeUsers: profileCount || 0,
    departureWindow,
  });
}

async function handleTickets(req, res, auth) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const { supabase } = auth;
  const today = new Date().toISOString().slice(0, 10);

  const { data: tickets, error: ticketsError } = await supabase
    .from("daily_tickets")
    .select(
      "id, user_id, travel_date, ticket_number, bus_route, dropoff_location, status, created_at"
    )
    .eq("travel_date", today)
    .order("ticket_number", { ascending: true });

  if (ticketsError) {
    return res.status(500).json({
      message: ticketsError.message,
    });
  }

  const { data: waitingList, error: waitingError } = await supabase
    .from("waiting_list")
    .select(
      "id, user_id, travel_date, waiting_position, bus_route, dropoff_location, status, created_at"
    )
    .eq("travel_date", today)
    .order("waiting_position", { ascending: true });

  if (waitingError) {
    return res.status(500).json({
      message: waitingError.message,
    });
  }

  const userIds = [
    ...(tickets || []).map((ticket) => ticket.user_id),
    ...(waitingList || []).map((record) => record.user_id),
  ].filter(Boolean);

  const uniqueUserIds = [...new Set(userIds)];

  let profilesById = {};

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, staff_id, division, phone")
      .in("id", uniqueUserIds);

    if (profilesError) {
      return res.status(500).json({
        message: profilesError.message,
      });
    }

    profilesById = (profiles || []).reduce((accumulator, profile) => {
      accumulator[profile.id] = profile;
      return accumulator;
    }, {});
  }

  const ticketsWithProfiles = (tickets || []).map((ticket) => ({
    ...ticket,
    profiles: profilesById[ticket.user_id] || null,
  }));

  const waitingListWithProfiles = (waitingList || []).map((record) => ({
    ...record,
    profiles: profilesById[record.user_id] || null,
  }));

  return res.status(200).json({
    travelDate: today,
    tickets: ticketsWithProfiles,
    waitingList: waitingListWithProfiles,
  });
}

async function handleUpdateUserStatus(req, res, auth) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const { user: adminUser, supabase } = auth;
  const { userId, isDisabled } = req.body || {};

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required.",
    });
  }

  if (typeof isDisabled !== "boolean") {
    return res.status(400).json({
      message: "Account status must be provided.",
    });
  }

  if (userId === adminUser.id && isDisabled) {
    return res.status(400).json({
      message: "You cannot disable your own admin account.",
    });
  }

  const { data: targetUser, error: targetUserError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_disabled")
    .eq("id", userId)
    .maybeSingle();

  if (targetUserError) {
    return res.status(500).json({
      message: targetUserError.message,
    });
  }

  if (!targetUser) {
    return res.status(404).json({
      message: "User profile was not found.",
    });
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from("profiles")
    .update({
      is_disabled: isDisabled,
    })
    .eq("id", userId)
    .select(
      "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled, created_at"
    )
    .single();

  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  await supabase.from("audit_logs").insert({
    user_id: adminUser.id,
    action: isDisabled ? "admin_disabled_user" : "admin_enabled_user",
    details: {
      target_user_id: targetUser.id,
      target_full_name: targetUser.full_name,
      target_email: targetUser.email,
      previous_is_disabled: targetUser.is_disabled,
      new_is_disabled: isDisabled,
    },
  });

  return res.status(200).json({
    message: isDisabled
      ? "User account has been disabled."
      : "User account has been reactivated.",
    user: updatedUser,
  });
}

async function handleUsers(req, res, auth) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const { supabase } = auth;

  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  const userIds = (users || []).map((user) => user.id).filter(Boolean);

  let presenceByUserId = {};

  if (userIds.length > 0) {
    const { data: presenceRows, error: presenceError } = await supabase
      .from("user_presence")
      .select("user_id, status, last_seen_at, current_page, updated_at")
      .in("user_id", userIds);

    if (presenceError) {
      return res.status(500).json({
        message: presenceError.message,
      });
    }

    presenceByUserId = (presenceRows || []).reduce((accumulator, presence) => {
      accumulator[presence.user_id] = presence;
      return accumulator;
    }, {});
  }

  const usersWithPresence = (users || []).map((user) => {
    const presence = presenceByUserId[user.id] || null;

    return {
      ...user,
      presence_status: presence?.status || "inactive",
      last_seen_at: presence?.last_seen_at || null,
      current_page: presence?.current_page || null,
      presence_updated_at: presence?.updated_at || null,
    };
  });

  return res.status(200).json({
    users: usersWithPresence,
  });
}

const adminHandlers = {
  "archive-tickets": handleArchiveTickets,
  "audit-logs": handleAuditLogs,
  "booking-history": handleBookingHistory,
  manifest: handleManifest,
  "privileged-users": handlePrivilegedUsers,
  "public-holidays": handlePublicHolidays,
  settings: handleSettings,
  summary: handleSummary,
  tickets: handleTickets,
  "update-user-status": handleUpdateUserStatus,
  users: handleUsers,
};

export default async function handler(req, res) {
  setNoStoreHeaders(res);
  try {
    const action = getAction(req);
    const selectedHandler = adminHandlers[action];

    if (!selectedHandler) {
      return res.status(404).json({
        message: `Unknown admin API action: ${action}`,
      });
    }

    const auth = await requireAdmin(req);

    if (auth.error) {
      return res.status(auth.error.status).json({
        message: auth.error.message,
      });
    }

    return selectedHandler(req, res, auth);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not process admin request.",
    });
  }
}
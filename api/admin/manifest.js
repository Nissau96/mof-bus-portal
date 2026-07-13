import { requireAdmin } from "../_utils/requireAdmin.js";
import { getAccraDateTimeParts } from "../_utils/bookingRules.js";

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

function buildCsv(rows) {
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

/**
 * Returns the passenger manifest for a selected travel date.
 *
 * Admin-only endpoint.
 *
 * Query params:
 * - date=YYYY-MM-DD
 * - format=json or csv
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  try {
    const auth = await requireAdmin(req);

    if (auth.error) {
      return res.status(auth.error.status).json({
        message: auth.error.message,
      });
    }

    const { supabase } = auth;
    const { dateISO: today } = getAccraDateTimeParts();

    const requestedDate = String(req.query.date || today).trim();
    const format = String(req.query.format || "json").trim().toLowerCase();

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(requestedDate)) {
      return res.status(400).json({
        message: "Date must be in YYYY-MM-DD format.",
      });
    }

    const { data: tickets, error: ticketsError } = await supabase
      .from("daily_tickets")
      .select(
        "id, user_id, travel_date, ticket_number, bus_route, dropoff_location, status"
      )
      .eq("travel_date", requestedDate)
      .eq("status", "confirmed")
      .order("ticket_number", { ascending: true });

    if (ticketsError) {
      return res.status(500).json({
        message: ticketsError.message,
      });
    }

    const userIds = (tickets || [])
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

    const manifest = (tickets || []).map((ticket) => ({
      ...ticket,
      profile: profilesById[ticket.user_id] || null,
    }));

    if (format === "csv") {
      const csv = buildCsv(manifest);
      const filename = `mof-bus-manifest-${requestedDate}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      return res.status(200).send(csv);
    }

    return res.status(200).json({
      travelDate: requestedDate,
      count: manifest.length,
      manifest,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load passenger manifest.",
    });
  }
}
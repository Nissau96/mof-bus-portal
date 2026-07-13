import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Returns archived booking history for admin users.
 *
 * Admin-only endpoint.
 *
 * This endpoint does not rely on Supabase embedded relationships.
 * It loads archived tickets first, then loads related profiles separately.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const auth = await requireAdmin(req);

    if (auth.error) {
      return res.status(auth.error.status).json({
        message: auth.error.message,
      });
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
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load booking history.",
    });
  }
}
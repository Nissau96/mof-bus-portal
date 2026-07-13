import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Returns today's ticket and waiting-list records for admin users.
 *
 * Admin-only endpoint.
 *
 * This version does not rely on Supabase embedded relationships because
 * some tables may not have foreign key relationships configured in the
 * schema cache.
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
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load admin ticket records.",
    });
  }
}
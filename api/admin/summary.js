import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Returns admin dashboard summary metrics.
 *
 * Admin-only endpoint.
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

    return res.status(200).json({
      travelDate: today,
      capacity,
      confirmedCount: confirmedCount || 0,
      availableSeats: Math.max(capacity - (confirmedCount || 0), 0),
      waitingCount: waitingCount || 0,
      cancelledCount: cancelledCount || 0,
      activeUsers: profileCount || 0,
      departureWindow: "4:45 PM - 5:00 PM",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load admin summary.",
    });
  }
}
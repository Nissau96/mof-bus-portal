import { getSupabaseAdmin } from "../_utils/supabaseAdmin.js";
import { getAuthUser } from "../_utils/getAuthUser.js";

/**
 * Returns the current booking summary:
 * - total capacity
 * - confirmed tickets
 * - available seats
 * - waiting-list count
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to view booking summary.",
      });
    }

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);

    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("bus_capacity, departure_start_time, departure_end_time")
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) {
      return res.status(500).json({
        message: settingsError.message,
      });
    }

    const capacity = settings?.bus_capacity || 36;

    const { count: confirmedCount, error: countError } = await supabase
      .from("daily_tickets")
      .select("*", { count: "exact", head: true })
      .eq("travel_date", today)
      .eq("status", "confirmed");

    if (countError) {
      return res.status(500).json({
        message: countError.message,
      });
    }

    const { count: waitingCount, error: waitingError } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("travel_date", today)
      .eq("status", "waiting");

    if (waitingError) {
      return res.status(500).json({
        message: waitingError.message,
      });
    }

    return res.status(200).json({
      travelDate: today,
      capacity,
      confirmedCount: confirmedCount || 0,
      availableSeats: Math.max(capacity - (confirmedCount || 0), 0),
      waitingCount: waitingCount || 0,
      departureWindow: "4:45 PM - 5:00 PM",
      bookingStatus: "Open",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load booking summary.",
    });
  }
}
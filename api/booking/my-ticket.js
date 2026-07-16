import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";

/**
 * Returns the authenticated user's ticket or waiting-list status for today.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to view ticket status.",
      });
    }

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);

    const { data: ticket, error: ticketError } = await supabase
      .from("daily_tickets")
      .select("*")
      .eq("user_id", user.id)
      .eq("travel_date", today)
      .eq("status", "confirmed")
      .maybeSingle();

    if (ticketError) {
      return res.status(500).json({
        message: ticketError.message,
      });
    }

    const { data: waiting, error: waitingError } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("user_id", user.id)
      .eq("travel_date", today)
      .eq("status", "waiting")
      .maybeSingle();

    if (waitingError) {
      return res.status(500).json({
        message: waitingError.message,
      });
    }

    return res.status(200).json({
      ticket,
      waiting,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load ticket status.",
    });
  }
}
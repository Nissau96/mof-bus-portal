import { getSupabaseAdmin } from "../_utils/supabaseAdmin.js";
import { getAuthUser } from "../_utils/getAuthUser.js";

/**
 * Creates a daily bus ticket for the authenticated user.
 *
 * The actual ticket allocation is handled by the PostgreSQL function
 * book_ticket_atomic so that ticket numbers remain safe under concurrency.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to book a ticket.",
      });
    }

    const { busRoute, dropoffLocation } = req.body;

    if (!busRoute || !dropoffLocation) {
      return res.status(400).json({
        message: "Bus route and drop-off location are required.",
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_disabled")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        message: profileError.message,
      });
    }

    if (!profile) {
      return res.status(404).json({
        message: "User profile was not found.",
      });
    }

    if (profile.is_disabled) {
      return res.status(403).json({
        message: "Your account has been disabled.",
      });
    }

    const { data: result, error: bookingError } = await supabase.rpc(
      "book_ticket_atomic",
      {
        p_user_id: user.id,
        p_bus_route: busRoute,
        p_dropoff_location: dropoffLocation,
      }
    );

    if (bookingError) {
      return res.status(500).json({
        message: bookingError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ticket_booking_attempt",
      details: {
        result,
        bus_route: busRoute,
        dropoff_location: dropoffLocation,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Ticket booking failed.",
    });
  }
}
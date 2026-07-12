import { getSupabaseAdmin } from "../_utils/supabaseAdmin.js";
import { getAuthUser } from "../_utils/getAuthUser.js";
import { sendPowerAutomateEmail } from "../_utils/powerAutomateEmail.js";

/**
 * Creates a daily bus ticket for the authenticated user.
 *
 * The actual ticket allocation is handled by the PostgreSQL function
 * book_ticket_atomic so that ticket numbers remain safe under concurrency.
 *
 * Power Automate email notifications are sent only when the user receives:
 * 1. A confirmed ticket
 * 2. A waiting-list position
 *
 * Email failure does not block the ticket booking.
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

    /**
     * Send Power Automate email only for new confirmed or waiting bookings.
     *
     * If result.status is "already_booked" or "already_waiting",
     * no email is sent because the user did not receive a new booking.
     */
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "power_automate_email_attempt",
        details: {
          result_status: result.status,
          to: profile.email,
          bus_route: busRoute,
          dropoff_location: dropoffLocation,
        },
      });

      if (result.status === "confirmed") {
        await sendPowerAutomateEmail({
          eventType: "ticket_confirmed",
          to: profile.email,
          fullName: profile.full_name,
          subject: "Your Bus Ticket Confirmation",
          message: "Your bus ticket has been confirmed successfully.",
          ticketNumber: String(result.ticket_number).padStart(2, "0"),
          travelDate: result.travel_date,
          busRoute: result.bus_route,
          dropoffLocation: result.dropoff_location,
          departureWindow: "4:45 PM - 5:00 PM",
        });
      }

      if (result.status === "waiting") {
        await sendPowerAutomateEmail({
          eventType: "waiting_list",
          to: profile.email,
          fullName: profile.full_name,
          subject: "You Have Been Added to the Waiting List",
          message:
            "The bus is currently full. You have been added to the waiting list and will be notified if a seat becomes available.",
          ticketNumber: `Waiting #${result.waiting_position}`,
          travelDate: result.travel_date,
          busRoute: result.bus_route,
          dropoffLocation: result.dropoff_location,
          departureWindow: "4:45 PM - 5:00 PM",
        });
      }

      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "power_automate_email_success",
        details: {
          result_status: result.status,
          to: profile.email,
        },
      });
    } catch (emailError) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "power_automate_email_failed",
        details: {
          result_status: result.status,
          to: profile.email,
          error: emailError.message,
        },
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Ticket booking failed.",
    });
  }
}
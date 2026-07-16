import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";
import { sendPowerAutomateEmail } from "../../server/_utils/powerAutomateEmail.js";

/**
 * Cancels the authenticated user's confirmed ticket for today.
 *
 * If a user is waiting for the same bus route, the first waiting-list user
 * is promoted to a confirmed ticket.
 *
 * Email failures are logged but do not block cancellation.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to cancel a ticket.",
      });
    }

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_disabled")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ message: profileError.message });
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

    const { data: ticket, error: ticketError } = await supabase
      .from("daily_tickets")
      .select(
        "id, travel_date, ticket_number, bus_route, dropoff_location, status"
      )
      .eq("user_id", user.id)
      .eq("travel_date", today)
      .eq("status", "confirmed")
      .maybeSingle();

    if (ticketError) {
      return res.status(500).json({ message: ticketError.message });
    }

    if (!ticket) {
      return res.status(404).json({
        message: "No confirmed ticket was found for today.",
      });
    }

    const { error: cancelError } = await supabase
      .from("daily_tickets")
      .update({
        status: "cancelled",
      })
      .eq("id", ticket.id);

    if (cancelError) {
      return res.status(500).json({ message: cancelError.message });
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ticket_cancelled",
      details: {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        bus_route: ticket.bus_route,
        dropoff_location: ticket.dropoff_location,
        travel_date: ticket.travel_date,
      },
    });

    try {
      await sendPowerAutomateEmail({
        eventType: "ticket_cancelled",
        to: profile.email,
        fullName: profile.full_name,
        subject: "Your Bus Ticket Has Been Cancelled",
        message:
          "Your bus ticket for today has been cancelled successfully.",
        ticketNumber: String(ticket.ticket_number).padStart(2, "0"),
        travelDate: ticket.travel_date,
        busRoute: ticket.bus_route,
        dropoffLocation: ticket.dropoff_location,
        departureWindow: "4:45 PM - 5:00 PM",
      });
    } catch (emailError) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "ticket_cancel_email_failed",
        details: {
          error: emailError.message,
          ticket_id: ticket.id,
        },
      });
    }

    const { data: waitingRecord, error: waitingError } = await supabase
      .from("waiting_list")
      .select(
        "id, user_id, travel_date, waiting_position, bus_route, dropoff_location, status"
      )
      .eq("travel_date", today)
      .eq("bus_route", ticket.bus_route)
      .eq("status", "waiting")
      .order("waiting_position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (waitingError) {
      return res.status(500).json({ message: waitingError.message });
    }

    let promoted = null;

    if (waitingRecord) {
      const { data: nextTicketNumber, error: nextTicketError } = await supabase
        .from("daily_tickets")
        .select("ticket_number")
        .eq("travel_date", today)
        .order("ticket_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nextTicketError) {
        return res.status(500).json({ message: nextTicketError.message });
      }

      const newTicketNumber = Number(nextTicketNumber?.ticket_number || 0) + 1;

      const { data: promotedTicket, error: promoteInsertError } = await supabase
        .from("daily_tickets")
        .insert({
          user_id: waitingRecord.user_id,
          travel_date: waitingRecord.travel_date,
          ticket_number: newTicketNumber,
          bus_route: waitingRecord.bus_route,
          dropoff_location: waitingRecord.dropoff_location,
          status: "confirmed",
        })
        .select(
          "id, user_id, travel_date, ticket_number, bus_route, dropoff_location, status"
        )
        .single();

      if (promoteInsertError) {
        return res.status(500).json({ message: promoteInsertError.message });
      }

      const { error: waitingUpdateError } = await supabase
        .from("waiting_list")
        .update({
          status: "promoted",
        })
        .eq("id", waitingRecord.id);

      if (waitingUpdateError) {
        return res.status(500).json({ message: waitingUpdateError.message });
      }

      const { data: promotedProfile, error: promotedProfileError } =
        await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", waitingRecord.user_id)
          .maybeSingle();

      if (promotedProfileError) {
        return res.status(500).json({
          message: promotedProfileError.message,
        });
      }

      promoted = promotedTicket;

      await supabase.from("audit_logs").insert({
        user_id: waitingRecord.user_id,
        action: "waiting_user_promoted",
        details: {
          waiting_list_id: waitingRecord.id,
          ticket_id: promotedTicket.id,
          ticket_number: promotedTicket.ticket_number,
          bus_route: promotedTicket.bus_route,
          dropoff_location: promotedTicket.dropoff_location,
        },
      });

      if (promotedProfile?.email) {
        try {
          await sendPowerAutomateEmail({
            eventType: "waiting_user_promoted",
            to: promotedProfile.email,
            fullName: promotedProfile.full_name,
            subject: "You Have Been Promoted to a Confirmed Bus Ticket",
            message:
              "A seat has become available and you have been promoted from the waiting list to a confirmed ticket.",
            ticketNumber: String(promotedTicket.ticket_number).padStart(2, "0"),
            travelDate: promotedTicket.travel_date,
            busRoute: promotedTicket.bus_route,
            dropoffLocation: promotedTicket.dropoff_location,
            departureWindow: "4:45 PM - 5:00 PM",
          });
        } catch (emailError) {
          await supabase.from("audit_logs").insert({
            user_id: waitingRecord.user_id,
            action: "promotion_email_failed",
            details: {
              error: emailError.message,
              waiting_list_id: waitingRecord.id,
              ticket_id: promotedTicket.id,
            },
          });
        }
      }
    }

    return res.status(200).json({
      message: promoted
        ? "Your ticket has been cancelled. A waiting-list user has been promoted."
        : "Your ticket has been cancelled.",
      cancelledTicket: {
        ticketNumber: String(ticket.ticket_number).padStart(2, "0"),
        travelDate: ticket.travel_date,
        busRoute: ticket.bus_route,
        dropoffLocation: ticket.dropoff_location,
      },
      promoted,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Ticket cancellation failed.",
    });
  }
}
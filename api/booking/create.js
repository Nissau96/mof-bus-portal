import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";
import { sendPowerAutomateEmail } from "../../server/_utils/powerAutomateEmail.js";
import { getBookingAvailability } from "../../server/_utils/bookingRules.js";

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

function formatTicketNumber(ticketNumber) {
  return String(ticketNumber || "").padStart(2, "0");
}

function formatDateForDisplay(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateForTicketId(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getBusRouteCode(busRoute) {
  const routeCodeMap = {
    "Adenta Bus": "ADE",
    "Sakumono Bus": "SAK",
    "Dansoman Bus": "DAN",
    "Kasoa Bus": "KAS",
    "Amasaman Bus": "AMA",
  };

  return routeCodeMap[busRoute] || "BUS";
}

function buildTicketId({ travelDate, busRoute, ticketNumber }) {
  const datePart = formatDateForTicketId(travelDate);
  const routeCode = getBusRouteCode(busRoute);
  const paddedTicketNumber = formatTicketNumber(ticketNumber);

  return `MOFBUSTIC-${datePart}-${routeCode}-${paddedTicketNumber}`;
}

function buildConfirmedTicketMessage({
  ticketId,
  ticketNumber,
  travelDate,
  busRoute,
  dropoffLocation,
  departureWindow,
}) {
  const styledTicketId = `<span style="color: rgb(97,189,109)"><strong>${ticketId}</strong></span>`;
  const styledTicketNumber = `<span style="color: rgb(97,189,109)"><strong>${formatTicketNumber(ticketNumber)}</strong></span>`;

  return `Your ticket request has been confirmed.

Your unique ticket ID is: ${styledTicketId}

Ticket Number: ${styledTicketNumber}
Travel Date: ${formatDateForDisplay(travelDate)}
Bus Route: ${busRoute}
Drop-off Location: ${dropoffLocation}
Departure Window: ${departureWindow}

Please note that this ticket is valid for this travel date only and should be presented when boarding the bus.

Thank you for your submission.`;
}

function buildWaitingListMessage({
  waitingPosition,
  travelDate,
  busRoute,
  dropoffLocation,
  departureWindow,
}) {
  const styledWaitingPosition = `<span style="color: rgb(139, 0, 0)"><strong>${waitingPosition}</strong></span>`;

  return `The bus is currently full.

You have been added to the waiting list and will be notified if a seat becomes available.

Waiting List Position: ${styledWaitingPosition}
Travel Date: ${formatDateForDisplay(travelDate)}
Bus Route: ${busRoute}
Drop-off Location: ${dropoffLocation}
Departure Window: ${departureWindow}

Please keep checking the MoF Bus Portal for updates.`;
}

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
      .select("id, full_name, email, staff_id, role, is_disabled")
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

    const availability = await getBookingAvailability({
      supabase,
      userProfile: profile,
    });

    if (!availability.canBook) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "ticket_booking_blocked",
        details: {
          reason: availability.reason,
          booking_status: availability.bookingStatus,
          attempted_at_time: availability.currentTime,
          travel_date: availability.dateISO,
          bus_route: busRoute,
          dropoff_location: dropoffLocation,
          is_privileged_user: availability.isPrivilegedUser,
          booking_window_type: availability.bookingWindowType,
          privileged_booking_window:
            availability.privilegedBookingWindowLabel,
          regular_booking_open_time: availability.bookingOpenTimeLabel,
        },
      });

      return res.status(403).json({
        message: availability.reason || "Booking is currently closed.",
        bookingStatus: availability.bookingStatus,
        canBook: false,
        isPrivilegedUser: availability.isPrivilegedUser,
        privilegedBookingWindow: availability.privilegedBookingWindowLabel,
        bookingOpenTime: availability.bookingOpenTimeLabel,
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
    is_privileged_user: availability.isPrivilegedUser,
    booking_window_type: availability.bookingWindowType,
    priority_rank: result.priority_rank,
    user_role: result.user_role,
  },
});

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
        const ticketNumber = formatTicketNumber(result.ticket_number);
        const ticketId = buildTicketId({
          travelDate: result.travel_date,
          busRoute: result.bus_route,
          ticketNumber: result.ticket_number,
        });

        await sendPowerAutomateEmail({
          eventType: "ticket_confirmed",
          to: profile.email,
          fullName: profile.full_name,
          subject: "Your MoF Bus Ticket Has Been Confirmed",
          message: buildConfirmedTicketMessage({
            ticketId,
            ticketNumber: result.ticket_number,
            travelDate: result.travel_date,
            busRoute: result.bus_route,
            dropoffLocation: result.dropoff_location,
            departureWindow: availability.departureWindow,
          }),
          ticketNumber,
          travelDate: result.travel_date,
          busRoute: result.bus_route,
          dropoffLocation: result.dropoff_location,
          departureWindow: availability.departureWindow,
        });
      }

      if (result.status === "waiting") {
        const waitingTicketNumber = `Waiting #${result.waiting_position}`;

        await sendPowerAutomateEmail({
          eventType: "waiting_list",
          to: profile.email,
          fullName: profile.full_name,
          subject: "You Have Been Added to the Bus Waiting List",
          message: buildWaitingListMessage({
            waitingPosition: waitingTicketNumber,
            travelDate: result.travel_date,
            busRoute: result.bus_route,
            dropoffLocation: result.dropoff_location,
            departureWindow: availability.departureWindow,
          }),
          ticketNumber: waitingTicketNumber,
          travelDate: result.travel_date,
          busRoute: result.bus_route,
          dropoffLocation: result.dropoff_location,
          departureWindow: availability.departureWindow,
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

    return res.status(200).json({
  ...result,
  isPrivilegedUser: availability.isPrivilegedUser,
  bookingWindowType: availability.bookingWindowType,
  privilegedBookingWindow: availability.privilegedBookingWindowLabel,
  regularBookingOpenTime: availability.bookingOpenTimeLabel,
  priorityRank: result.priority_rank,
  userRole: result.user_role,
});
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Ticket booking failed.",
    });
  }
}
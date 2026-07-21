import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";
import { getBookingAvailability } from "../../server/_utils/bookingRules.js";

function setNoStoreHeaders(res) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}

/**
 * Returns today's booking summary for the authenticated user.
 *
 * Seat availability is hidden from non-admin users until the regular
 * booking period begins. Admin users always receive the real seat count.
 */
export default async function handler(req, res) {
  setNoStoreHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to view the booking summary.",
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, staff_id, role, is_disabled")
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

    const { count: confirmedCount, error: confirmedError } = await supabase
      .from("daily_tickets")
      .select("*", { count: "exact", head: true })
      .eq("travel_date", availability.dateISO)
      .eq("status", "confirmed");

    if (confirmedError) {
      return res.status(500).json({
        message: confirmedError.message,
      });
    }

    const { count: waitingCount, error: waitingError } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("travel_date", availability.dateISO)
      .eq("status", "waiting");

    if (waitingError) {
      return res.status(500).json({
        message: waitingError.message,
      });
    }

    const actualConfirmedCount = confirmedCount || 0;

    const actualAvailableSeats = Math.max(
  availability.capacity - actualConfirmedCount,
  0
);

const isAdmin = profile.role === "admin";

const regularBookingHasStarted =
  availability.bookingWindowType === "regular";

const displayAvailableSeats =
  isAdmin || regularBookingHasStarted
    ? actualAvailableSeats
    : availability.capacity;

    return res.status(200).json({
      travelDate: availability.dateISO,
      capacity: availability.capacity,

      confirmedCount: isAdmin ? actualConfirmedCount : undefined,

      availableSeats: displayAvailableSeats,

seatAvailabilityHidden: false,

seatAvailabilityMessage:
  !isAdmin && !regularBookingHasStarted
    ? `Seat availability will reflect live bookings when regular booking opens at ${availability.bookingOpenTimeLabel}.`
    : null,

      waitingCount: waitingCount || 0,
      departureWindow: availability.departureWindow,
      bookingOpenTime: availability.bookingOpenTimeLabel,
      privilegedBookingWindow:
        availability.privilegedBookingWindowLabel,
      bookingStatus: availability.bookingStatus,
      bookingStatusReason: availability.reason,
      canBook: availability.canBook,
      isPrivilegedUser: availability.isPrivilegedUser,
      bookingWindowType: availability.bookingWindowType,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load booking summary.",
    });
  }
}
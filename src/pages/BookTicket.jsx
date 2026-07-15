import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Info,
  MapPinned,
  TicketCheck,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import BookingSummaryCard from "../components/booking/BookingSummaryCard";
import RouteSelect from "../components/auth/RouteSelect";
import { ROUTE_SUMMARY } from "../constants/bookingData";
import { BUS_ROUTES } from "../constants/busRoutes";
import { useTheme } from "../context/useTheme";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";

/**
 * Formats a date from YYYY-MM-DD to DD/MM/YYYY.
 *
 * Example:
 * 2026-07-12 becomes 12/07/2026
 */
function formatDisplayDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Gets the weekday name from a date.
 *
 * Example:
 * 2026-07-12 becomes Sunday
 */
function getWeekdayName(dateValue) {
  if (!dateValue) {
    return "Loading";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(date);
}

/**
 * BookTicket page.
 *
 * This page connects to the backend booking API.
 * The backend creates a ticket or adds the user to the waiting list.
 *
 * Normal users do not see the waiting-list metric card because that is
 * more appropriate for the admin dashboard.
 */
export default function BookTicket() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [dropoffLocation, setDropoffLocation] = useState("");
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBookingClosed = summary?.canBook === false;

  /**
   * Refreshes the booking summary, profile, and user's current ticket status.
   *
   * This function is called after successful booking submission or cancellation.
   */
  const loadBookingData = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        const [profileData, summaryData, ticketData] = await Promise.all([
          apiFetch("/api/profile/me"),
          apiFetch("/api/booking/summary"),
          apiFetch("/api/booking/my-ticket"),
        ]);

        setProfile(profileData.profile);
        setSummary(summaryData);
        setCurrentStatus(ticketData);

        if (profileData.profile?.dropoff_location) {
          setDropoffLocation(profileData.profile.dropoff_location);
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Could not load booking details",
          message: error.message || "Failed to load booking information.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Handles ticket booking submission.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (isBookingClosed) {
      showToast({
        type: "warning",
        title: "Booking closed",
        message: summary?.bookingStatusReason || "Booking is currently closed.",
      });
      return;
    }

    if (!dropoffLocation) {
      showToast({
        type: "warning",
        title: "Drop-off location required",
        message: "Please select your drop-off location before submitting.",
      });
      return;
    }

    if (!profile?.bus_route) {
      showToast({
        type: "error",
        title: "Bus route not assigned",
        message:
          "Your profile does not have a bus route assigned. Please contact the transport administrator.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await apiFetch("/api/booking/create", {
        method: "POST",
        body: JSON.stringify({
          busRoute: profile.bus_route,
          dropoffLocation,
        }),
      });

      const bookingStatus = data.status || data.booking?.status;

      setBookingResult(data);

      showToast({
        type: bookingStatus === "waiting" ? "warning" : "success",
        title:
          bookingStatus === "waiting" ? "Added to waiting list" : "Ticket booked",
        message: data.message || "Your booking request has been processed.",
      });

      await loadBookingData();
    } catch (error) {
      showToast({
        type: "error",
        title: "Booking failed",
        message: error.message || "Could not submit your booking.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelTicket() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your ticket for today?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await apiFetch("/api/booking/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      });

      showToast({
        type: "success",
        title: "Ticket cancelled",
        message: data.message || "Your ticket has been cancelled successfully.",
      });

      setBookingResult(null);
      await loadBookingData();
    } catch (error) {
      showToast({
        type: "error",
        title: "Cancellation failed",
        message: error.message || "Could not cancel your ticket.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    loadBookingData({ showLoader: false });
  }, [loadBookingData]);

  const travelDate = summary?.travelDate;

  const summaryCards = [
    {
      label: "Booking Status",
      value: summary?.bookingStatus || "Loading",
      description: summary?.bookingOpenTime
        ? `Opens at ${summary.bookingOpenTime}`
        : "Available for today",
      icon: CheckCircle2,
    },
    {
      label: "Available Seats",
      value: String(summary?.availableSeats ?? "-"),
      description: "Current remaining capacity",
      icon: TicketCheck,
    },
    {
      label: "Travel Date",
      value: formatDisplayDate(travelDate),
      description: getWeekdayName(travelDate),
      icon: CalendarClock,
    },
  ];

  const confirmedTicket = currentStatus?.ticket;
  const waitingRecord = currentStatus?.waiting;

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-bold ${isDark
              ? "text-slate-300 hover:text-white"
              : "text-slate-600 hover:text-mof-primary"
            }`}
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${isDark ? "text-emerald-200" : "text-mof-primary"
                }`}
            >
              Daily Staff Transport
            </p>

            <h1
              className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              Book Your Bus Ticket
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Select your preferred drop-off location and submit your booking
              request for today’s Ministry staff bus.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((item) => (
          <BookingSummaryCard
            key={item.label}
            label={item.label}
            value={item.value}
            description={item.description}
            icon={item.icon}
            isDark={isDark}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
        <form
          onSubmit={handleSubmit}
          className={`rounded-3xl p-5 sm:p-6 ${isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
            }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isDark
                  ? "bg-white/10 text-emerald-200"
                  : "bg-emerald-50 text-mof-primary"
                }`}
            >
              <TicketCheck size={22} />
            </div>

            <div>
              <h2
                className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                  }`}
              >
                Ticket Request
              </h2>

              <p
                className={`mt-1 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"
                  }`}
              >
                A confirmed ticket is allocated on a first-come, first-served
                basis. If the bus is full, you will be added to the waiting
                list.
              </p>

              <div
                className={`mt-4 inline-flex rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${isDark
                    ? "bg-white/10 text-emerald-200"
                    : "bg-emerald-50 text-mof-primary"
                  }`}
              >
                Assigned Bus Route: {profile?.bus_route || "Loading..."}
              </div>
            </div>
          </div>

          {isLoading && (
            <div
              className={`mt-6 rounded-2xl p-4 text-sm font-semibold ${isDark
                  ? "bg-white/5 text-slate-300"
                  : "bg-slate-50 text-slate-600"
                }`}
            >
              Loading your current booking status...
            </div>
          )}

          {summary?.bookingStatusReason && (
            <div
              className={`mt-5 rounded-2xl p-4 text-sm font-bold ${isBookingClosed
                  ? isDark
                    ? "bg-red-500/10 text-red-200"
                    : "bg-red-50 text-red-700"
                  : isDark
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-emerald-50 text-mof-primary"
                }`}
            >
              {summary.bookingStatusReason}
            </div>
          )}

          {confirmedTicket && (
            <div
              className={`mt-6 rounded-2xl p-5 ${isDark
                  ? "bg-emerald-500/10 text-emerald-100"
                  : "bg-emerald-50 text-mof-primary"
                }`}
            >
              <p className="text-sm font-bold uppercase tracking-wide">
                Confirmed Ticket
              </p>

              <p className="mt-3 text-5xl font-black">
                {String(confirmedTicket.ticket_number).padStart(2, "0")}
              </p>

              <p className="mt-3 text-sm leading-6">
                Drop-off: <strong>{confirmedTicket.dropoff_location}</strong>
              </p>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCancelTicket}
                className={`mt-5 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark
                    ? "bg-red-500/20 text-red-100 hover:bg-red-500/30"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
              >
                {isSubmitting ? "Processing..." : "Cancel Ticket"}
              </button>
            </div>
          )}

          {waitingRecord && (
            <div
              className={`mt-6 rounded-2xl p-5 ${isDark
                  ? "bg-amber-500/10 text-amber-100"
                  : "bg-amber-50 text-amber-800"
                }`}
            >
              <p className="text-sm font-bold uppercase tracking-wide">
                Waiting List
              </p>

              <p className="mt-3 text-5xl font-black">
                #{waitingRecord.waiting_position}
              </p>

              <p className="mt-3 text-sm leading-6">
                You will be promoted if a seat becomes available.
              </p>
            </div>
          )}

          {!confirmedTicket && !waitingRecord && (
            <>
              <div className="mt-6">
                <RouteSelect
                  value={dropoffLocation}
                  onChange={setDropoffLocation}
                />
              </div>

              {bookingResult && (
                <div
                  className={`mt-5 flex items-start gap-3 rounded-2xl p-4 ${isDark
                      ? "bg-emerald-500/10 text-emerald-100"
                      : "bg-emerald-50 text-mof-primary"
                    }`}
                >
                  <CheckCircle2 className="mt-0.5 shrink-0" size={20} />

                  <div>
                    <p className="font-bold">{bookingResult.message}</p>
                    <p className="mt-1 text-sm leading-6">
                      Status:{" "}
                      <strong>
                        {bookingResult.status || bookingResult.booking?.status || "Processed"}
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              <div
                className={`mt-6 flex items-start gap-3 rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"
                  }`}
              >
                <Info
                  className={`mt-0.5 shrink-0 ${isDark ? "text-slate-300" : "text-slate-500"
                    }`}
                  size={19}
                />

                <p
                  className={`text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  Each user can only hold one ticket per travel day. When the bus
                  is full, users will be added to the waiting list.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  to="/dashboard"
                  className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-5 text-sm font-bold ${isDark
                      ? "border-white/10 text-slate-300 hover:bg-white/10"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting || isBookingClosed}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark
                      ? "bg-white text-slate-950 hover:bg-emerald-100"
                      : "bg-mof-primary text-white hover:bg-mof-primary-container"
                    }`}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : isBookingClosed
                      ? "Booking Closed"
                      : "Submit Booking"}

                  {!isSubmitting && !isBookingClosed && (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <aside
          className={`rounded-3xl p-5 sm:p-6 ${isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
            }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isDark
                  ? "bg-white/10 text-emerald-200"
                  : "bg-emerald-50 text-mof-primary"
                }`}
            >
              <ROUTE_SUMMARY.icon size={22} />
            </div>

            <div>
              <h2
                className={`font-black ${isDark ? "text-white" : "text-slate-950"
                  }`}
              >
                {ROUTE_SUMMARY.title}
              </h2>

              <p
                className={`mt-1 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"
                  }`}
              >
                {ROUTE_SUMMARY.description}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {BUS_ROUTES.map((route, index) => (
              <div
                key={route}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isDark ? "bg-white/5" : "bg-slate-50"
                  }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${isDark
                      ? "bg-white/10 text-emerald-200"
                      : "bg-emerald-50 text-mof-primary"
                    }`}
                >
                  {index + 1}
                </span>

                <span
                  className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                >
                  {route}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`mt-6 rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-3">
              <MapPinned
                size={19}
                className={isDark ? "text-emerald-200" : "text-mof-primary"}
              />

              <p
                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-950"
                  }`}
              >
                Assigned route: {profile?.bus_route || "Loading..."}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
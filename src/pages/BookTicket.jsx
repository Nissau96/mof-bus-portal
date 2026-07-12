import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  MapPinned,
  TicketCheck,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import BookingSummaryCard from "../components/booking/BookingSummaryCard";
import RouteSelect from "../components/auth/RouteSelect";
import { BOOKING_SUMMARY, ROUTE_SUMMARY } from "../constants/bookingData";
import { BUS_ROUTES } from "../constants/busRoutes";
import { useTheme } from "../context/useTheme";

/**
 * BookTicket page.
 *
 * This is currently a frontend-only booking form.
 * Later, handleSubmit will call the Vercel backend API,
 * which will create a ticket in Supabase.
 */
export default function BookTicket() {
  const { isDark } = useTheme();

  const [dropoffLocation, setDropoffLocation] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    if (!dropoffLocation) {
      alert("Please select your preferred drop-off location.");
      return;
    }

    // Placeholder confirmation.
    // Later this will call POST /api/book-ticket.
    setHasSubmitted(true);
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <a
          href="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-bold ${
            isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-mof-primary"
          }`}
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </a>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              Daily Staff Transport
            </p>

            <h1
              className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Book Your Bus Ticket
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm leading-6 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Select your preferred drop-off location and submit your booking
              request for today’s Ministry staff bus.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {BOOKING_SUMMARY.map((item) => (
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
          className={`rounded-3xl p-5 sm:p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isDark
                  ? "bg-white/10 text-emerald-200"
                  : "bg-emerald-50 text-mof-primary"
              }`}
            >
              <TicketCheck size={22} />
            </div>

            <div>
              <h2
                className={`text-xl font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                Ticket Request
              </h2>

              <p
                className={`mt-1 text-sm leading-6 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                A confirmed ticket will be allocated on a first-come,
                first-served basis when the backend logic is connected.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <RouteSelect
              value={dropoffLocation}
              onChange={setDropoffLocation}
            />
          </div>

          {hasSubmitted && (
            <div
              className={`mt-5 flex items-start gap-3 rounded-2xl p-4 ${
                isDark
                  ? "bg-emerald-500/10 text-emerald-100"
                  : "bg-emerald-50 text-mof-primary"
              }`}
            >
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold">
                  Booking placeholder submitted
                </p>
                <p className="mt-1 text-sm leading-6">
                  Your selected drop-off location is{" "}
                  <strong>{dropoffLocation}</strong>. Supabase booking logic
                  will be connected in a later step.
                </p>
              </div>
            </div>
          )}

          <div
            className={`mt-6 flex items-start gap-3 rounded-2xl p-4 ${
              isDark ? "bg-white/5" : "bg-slate-50"
            }`}
          >
            <Info
              className={`mt-0.5 shrink-0 ${
                isDark ? "text-slate-300" : "text-slate-500"
              }`}
              size={19}
            />

            <p
              className={`text-sm leading-6 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Each user can only hold one ticket per travel day. When the bus
              is full, users will be added to the waiting list.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <a
              href="/dashboard"
              className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-5 text-sm font-bold ${
                isDark
                  ? "border-white/10 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cancel
            </a>

            <button
              type="submit"
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition ${
                isDark
                  ? "bg-white text-slate-950 hover:bg-emerald-100"
                  : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
            >
              Submit Booking
              <ArrowRight size={18} />
            </button>
          </div>
        </form>

        <aside
          className={`rounded-3xl p-5 sm:p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isDark
                  ? "bg-white/10 text-emerald-200"
                  : "bg-emerald-50 text-mof-primary"
              }`}
            >
              <ROUTE_SUMMARY.icon size={22} />
            </div>

            <div>
              <h2
                className={`font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                {ROUTE_SUMMARY.title}
              </h2>

              <p
                className={`mt-1 text-sm leading-6 ${
                  isDark ? "text-slate-400" : "text-slate-600"
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  isDark ? "bg-white/5" : "bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                    isDark
                      ? "bg-white/10 text-emerald-200"
                      : "bg-emerald-50 text-mof-primary"
                  }`}
                >
                  {index + 1}
                </span>

                <span
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  {route}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`mt-6 rounded-2xl p-4 ${
              isDark ? "bg-white/5" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <MapPinned
                size={19}
                className={isDark ? "text-emerald-200" : "text-mof-primary"}
              />
              <p
                className={`text-sm font-bold ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                Final stop: Adenta
              </p>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  CloudSun,
  ShieldCheck,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import MetricCard from "../components/dashboard/MetricCard";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import {
  USER_DASHBOARD_METRICS,
  USER_QUICK_ACTIONS,
} from "../constants/dashboardData";
import { useTheme } from "../context/useTheme";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";

/**
 * Formats a date like 2026-07-13 into Monday, July 13.
 */
function formatHeroDate(dateValue) {
  if (!dateValue) {
    return "Today";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Converts the database role value into a user-friendly label.
 *
 * Database values:
 * - admin
 * - staff
 * - intern_nsp
 */
function getRoleLabel(role) {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "intern_nsp") {
    return "Intern/NSP";
  }

  if (role === "staff") {
    return "Staff";
  }

  return "User";
}

/**
 * Dashboard page.
 *
 * This keeps the existing dashboard layout, metric cards, quick action cards,
 * and hero card design while loading live data from Supabase through the API.
 */
export default function Dashboard() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [profileData, summaryData, ticketData] = await Promise.all([
        apiFetch("/api/profile/me"),
        apiFetch("/api/booking/summary"),
        apiFetch("/api/booking/my-ticket"),
      ]);

      setProfile(profileData.profile);
      setSummary(summaryData);
      setTicketStatus(ticketData);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load dashboard",
        message: error.message || "Failed to load your dashboard data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const firstName = profile?.full_name?.split(" ")?.[0] || "User";
  const heroDate = formatHeroDate(summary?.travelDate);
  const roleLabel = getRoleLabel(profile?.role);

  const confirmedTicket = ticketStatus?.ticket;
  const waitingRecord = ticketStatus?.waiting;

  let todayTicketValue = "-";
  let todayTicketDescription = "No confirmed ticket yet";

  if (confirmedTicket?.ticket_number) {
    todayTicketValue = String(confirmedTicket.ticket_number).padStart(2, "0");
    todayTicketDescription = "Your ticket number for today";
  }

  if (waitingRecord?.waiting_position) {
    todayTicketValue = `Waiting #${waitingRecord.waiting_position}`;
    todayTicketDescription = "You are currently on the waiting list";
  }

  /**
   * Keep the existing metric cards from dashboardData.js,
   * but override the values dynamically.
   *
   * Supports:
   * - Today’s Ticket
   * - Today’s Ticket #
   * - Available Seats
   */
  const dashboardMetrics = USER_DASHBOARD_METRICS.map((metric) => {
    const isTicketMetric =
      metric.label === "Today’s Ticket" ||
      metric.label === "Today’s Ticket #";

    const isAvailableSeatsMetric = metric.label === "Available Seats";

    if (isTicketMetric) {
      return {
        ...metric,
        value: isLoading ? "Loading" : todayTicketValue,
        description: isLoading
          ? "Checking today’s ticket number"
          : todayTicketDescription,
      };
    }

    if (isAvailableSeatsMetric) {
      return {
        ...metric,
        value: isLoading ? "Loading" : String(summary?.availableSeats ?? "-"),
        description: "Current remaining capacity",
      };
    }

    return metric;
  });

  const scheduleItems = [
    ["Division", isLoading ? "Loading" : profile?.division || "Not assigned"],
    ["Booking Status", isLoading ? "Loading" : summary?.bookingStatus || "Open"],
    ["Departure Window", summary?.departureWindow || "4:45 PM - 5:00 PM"],
    ["Assigned Bus Route", profile?.bus_route || "Not assigned"],
    ["Drop-off Location", profile?.dropoff_location || "Not selected"],
  ];

  return (
    <DashboardShell>
      {/* Hero / welcome area */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section
          className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 lg:p-10 ${
            isDark
              ? "border border-white/10 bg-[#3e5048]"
              : "border border-slate-200 bg-white"
          }`}
        >
          <div
            className={`pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full border-[22px] ${
              isDark ? "border-white/5" : "border-emerald-100"
            }`}
          />

          <div
            className={`pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[18px] ${
              isDark ? "border-white/5" : "border-emerald-50"
            }`}
          />

          <div className="relative z-10">
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-white/80" : "text-mof-primary"
              }`}
            >
              Good morning, {firstName} • {heroDate}
            </p>

            <h1
              className={`mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Personal Workspace
            </h1>

            <p
              className={`mt-4 max-w-2xl text-sm font-semibold leading-6 sm:text-base ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Your staff transport bookings, ticket status, and route tasks in
              one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
                  isDark
                    ? "bg-slate-950/40 text-white"
                    : "bg-emerald-50 text-mof-primary"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isDark ? "bg-white" : "bg-mof-primary"
                  }`}
                />
                {roleLabel}
              </span>

              <span
                className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${
                  isDark
                    ? "border-white/10 bg-white/10 text-white/80"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {profile?.division || "Division not assigned"}
              </span>

              {profile?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide ${
                    isDark
                      ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>

          <div
            className={`absolute right-8 top-8 hidden md:block ${
              isDark ? "text-white/60" : "text-mof-primary/30"
            }`}
          >
            <CloudSun size={42} />
          </div>
        </section>

        <aside
          className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 ${
            isDark
              ? "border border-white/10 bg-[#838e85]"
              : "border border-slate-200 bg-mof-surface-muted"
          }`}
        >
          <div
            className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${
              isDark ? "bg-white/10" : "bg-white/60"
            }`}
          />

          <div className="relative z-10">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                isDark
                  ? "bg-white/15 text-orange-200"
                  : "bg-white text-mof-primary"
              }`}
            >
              <ClipboardList size={26} />
            </div>

            <h2
              className={`mt-6 text-xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Bus Ticketing
            </h2>

            <p
              className={`mt-3 text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Book, track, and manage your daily staff bus ticket in one place.
            </p>

            <Link
              to="/book"
              className={`mt-10 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-black shadow-lg transition ${
                isDark
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
            >
              {confirmedTicket ? "View today’s ticket" : "Book ticket now"}
            </Link>
          </div>
        </aside>
      </div>

      {/* User metrics */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {dashboardMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            tone={metric.tone}
            isDark={isDark}
          />
        ))}
      </section>

      {/* Main lower content */}
      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div
          className={`rounded-3xl p-5 sm:p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Quick Actions</h2>

              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                Common user tasks for your transport account.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                isDark
                  ? "bg-emerald-500/10 text-emerald-200"
                  : "bg-emerald-50 text-mof-primary"
              }`}
            >
              <ShieldCheck size={15} />
              Secure portal
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {USER_QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.label}
                label={action.label}
                description={action.description}
                href={action.href}
                icon={action.icon}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        <aside
          className={`rounded-3xl p-5 sm:p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isDark
                  ? "bg-white/10 text-emerald-200"
                  : "bg-emerald-50 text-mof-primary"
              }`}
            >
              <CalendarDays size={22} />
            </div>

            <div>
              <h2 className="font-black">Today’s Schedule</h2>
              <p className={`text-sm ${mutedTextClass}`}>Ministry staff bus</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {scheduleItems.map(([label, value]) => (
              <div
                key={label}
                className={`rounded-2xl p-4 ${
                  isDark ? "bg-white/5" : "bg-slate-50"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {label}
                </p>

                <p
                  className={`mt-2 text-lg font-black ${
                    isDark ? "text-white" : "text-slate-950"
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
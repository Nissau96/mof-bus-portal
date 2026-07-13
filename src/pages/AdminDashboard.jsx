import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Clock3,
  ShieldCheck,
  TicketCheck,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import MetricCard from "../components/dashboard/MetricCard";
import { useTheme } from "../context/useTheme";
import { apiFetch } from "../lib/api";

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
 * Admin Dashboard page.
 *
 * Shows operational metrics for today's staff bus service.
 */
export default function AdminDashboard() {
  const { isDark } = useTheme();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminSummary() {
      try {
        setIsLoading(true);

        const data = await apiFetch("/api/admin/summary");

        setSummary(data);
      } catch (error) {
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminSummary();
  }, []);

  const metrics = [
    {
      label: "Confirmed Tickets",
      value: isLoading ? "Loading" : String(summary?.confirmedCount ?? "-"),
      description: "Users with confirmed seats today",
      icon: TicketCheck,
      tone: "green",
    },
    {
      label: "Available Seats",
      value: isLoading ? "Loading" : String(summary?.availableSeats ?? "-"),
      description: "Remaining seats for today",
      icon: CalendarCheck,
      tone: "blue",
    },
    {
      label: "Waiting List",
      value: isLoading ? "Loading" : String(summary?.waitingCount ?? "-"),
      description: "Users waiting for promotion",
      icon: UsersRound,
      tone: "blue",
    },
    {
      label: "Cancelled Tickets",
      value: isLoading ? "Loading" : String(summary?.cancelledCount ?? "-"),
      description: "Cancelled tickets today",
      icon: XCircle,
      tone: "blue",
    },
    {
      label: "Bus Capacity",
      value: isLoading ? "Loading" : String(summary?.capacity ?? "-"),
      description: "Configured maximum seats",
      icon: ShieldCheck,
      tone: "green",
    },
    {
      label: "Active Users",
      value: isLoading ? "Loading" : String(summary?.activeUsers ?? "-"),
      description: "Enabled user profiles",
      icon: UserRoundCheck,
      tone: "blue",
    },
  ];

  return (
    <DashboardShell>
      <div className="mb-6">
        <a
          href="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-bold ${isDark
            ? "text-slate-300 hover:text-white"
            : "text-slate-600 hover:text-mof-primary"
            }`}
        >
          <ArrowLeft size={17} />
          Back to user dashboard
        </a>
      </div>

      <section
        className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 ${isDark
          ? "border border-white/10 bg-[#3e5048]"
          : "border border-slate-200 bg-white"
          }`}
      >
        <div
          className={`pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[18px] ${isDark ? "border-white/5" : "border-emerald-50"
            }`}
        />

        <div className="relative z-10">
          <p
            className={`text-xs font-black uppercase tracking-[0.22em] ${isDark ? "text-white/80" : "text-mof-primary"
              }`}
          >
            Admin Operations
          </p>

          <h1
            className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-slate-950"
              }`}
          >
            Transport Admin Dashboard
          </h1>

          <p
            className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${isDark ? "text-white" : "text-slate-700"
              }`}
          >
            Monitor today’s confirmed tickets, waiting list, cancellations, and
            available seats for the staff bus service.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${isDark
                ? "bg-slate-950/40 text-white"
                : "bg-emerald-50 text-mof-primary"
                }`}
            >
              <ShieldCheck size={15} />
              Admin Access
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${isDark
                ? "border-white/10 bg-white/10 text-white/80"
                : "border-slate-200 bg-white text-slate-600"
                }`}
            >
              <Clock3 size={15} />
              {summary?.departureWindow || "4:45 PM - 5:00 PM"}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
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

      <section
        className={`mt-8 rounded-3xl p-5 sm:p-6 ${isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              Ticket Management
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              View today’s confirmed, cancelled, and waiting-list records.
            </p>
          </div>

          <a
            href="/admin/tickets"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
              ? "bg-white text-slate-950 hover:bg-emerald-100"
              : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            View Today’s Tickets
          </a>
        </div>
      </section>

      <section
        className={`mt-5 rounded-3xl p-5 sm:p-6 ${isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              System Settings
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Update bus capacity, booking open time, and departure window.
            </p>
          </div>

          <a
            href="/admin/settings"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
              ? "bg-white text-slate-950 hover:bg-emerald-100"
              : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            Manage Settings
          </a>
        </div>
      </section>

      <section
        className={`mt-5 rounded-3xl p-5 sm:p-6 ${isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              Audit Logs
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Review system activity, booking actions, user changes, and settings
              updates.
            </p>
          </div>

          <a
            href="/admin/audit-logs"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
              ? "bg-white text-slate-950 hover:bg-emerald-100"
              : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            View Audit Logs
          </a>
        </div>
      </section>

      <section
        className={`mt-5 rounded-3xl p-5 sm:p-6 ${isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              User Management
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              View registered users, roles, divisions, routes, and account status.
            </p>
          </div>

          <a
            href="/admin/users"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
              ? "bg-white text-slate-950 hover:bg-emerald-100"
              : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            View Users
          </a>
        </div>
      </section>

      <section
        className={`mt-5 rounded-3xl p-5 sm:p-6 ${isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              Privileged Users
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Manage staff who should receive priority consideration during daily
              bus booking.
            </p>
          </div>

          <a
            href="/admin/privileged-users"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
              ? "bg-white text-slate-950 hover:bg-emerald-100"
              : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            Manage Privileged Users
          </a>
        </div>
      </section>

      <section
        className={`mt-5 rounded-3xl p-5 sm:p-6 ${isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              Booking History
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              View archived ticket records from previous service days.
            </p>
          </div>

          <a
            href="/admin/booking-history"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
              ? "bg-white text-slate-950 hover:bg-emerald-100"
              : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            View Booking History
          </a>
        </div>
      </section>

      <section
        className={`mt-5 rounded-3xl p-5 sm:p-6 ${isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              Public Holidays
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Manage dates where staff bus booking should automatically close.
            </p>
          </div>

          <a
            href="/admin/public-holidays"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
                ? "bg-white text-slate-950 hover:bg-emerald-100"
                : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            Manage Public Holidays
          </a>
        </div>
      </section>

      <section
        className={`mt-5 rounded-3xl p-5 sm:p-6 ${isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
          }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
                }`}
            >
              System Maintenance
            </h2>
            <p
              className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Archive old daily ticket records and clean up old waiting-list records.
            </p>
          </div>

          <a
            href="/admin/maintenance"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${isDark
                ? "bg-white text-slate-950 hover:bg-emerald-100"
                : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
          >
            Open Maintenance
          </a>
        </div>
      </section>

      <section
        className={`mt-8 rounded-3xl p-5 sm:p-6 ${isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
          }`}
      >
        <h2
          className={`text-xl font-black ${isDark ? "text-white" : "text-slate-950"
            }`}
        >
          Today’s Service Summary
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Travel Date", formatDisplayDate(summary?.travelDate)],
            ["Departure Window", summary?.departureWindow || "4:45 PM - 5:00 PM"],
            ["Capacity", summary?.capacity ?? "-"],
            ["Available Seats", summary?.availableSeats ?? "-"],
          ].map(([label, value]) => (
            <div
              key={label}
              className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"
                }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"
                  }`}
              >
                {label}
              </p>
              <p
                className={`mt-2 text-lg font-black ${isDark ? "text-white" : "text-slate-950"
                  }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
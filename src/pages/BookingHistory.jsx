import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  History,
  MapPinned,
  TicketCheck,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
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

function formatCreatedDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status) {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "waiting") {
    return "Waiting";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  if (status === "archived") {
    return "Archived";
  }

  return status || "Unknown";
}

function getStatusClass(status, isDark) {
  if (status === "confirmed") {
    return isDark
      ? "bg-emerald-500/10 text-emerald-200"
      : "bg-emerald-50 text-mof-primary";
  }

  if (status === "waiting") {
    return isDark
      ? "bg-amber-500/10 text-amber-200"
      : "bg-amber-50 text-amber-800";
  }

  if (status === "cancelled") {
    return isDark
      ? "bg-red-500/10 text-red-200"
      : "bg-red-50 text-red-700";
  }

  return isDark
    ? "bg-white/10 text-slate-200"
    : "bg-slate-100 text-slate-700";
}

function HistoryCard({ item, isDark }) {
  return (
    <div
      className={`rounded-3xl p-5 ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className={`text-xs font-black uppercase tracking-[0.22em] ${
              isDark ? "text-emerald-200" : "text-mof-primary"
            }`}
          >
            Ticket
          </p>

          <h2
            className={`mt-2 text-4xl font-black ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {item.ticketNumber}
          </h2>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${getStatusClass(
            item.status,
            isDark
          )}`}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-2xl p-4 ${
            isDark ? "bg-white/5" : "bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <CalendarDays
              size={18}
              className={isDark ? "text-emerald-200" : "text-mof-primary"}
            />
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Travel Date
              </p>
              <p
                className={`mt-1 font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                {formatDisplayDate(item.travelDate)}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 ${
            isDark ? "bg-white/5" : "bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <TicketCheck
              size={18}
              className={isDark ? "text-emerald-200" : "text-mof-primary"}
            />
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Bus Route
              </p>
              <p
                className={`mt-1 font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                {item.busRoute || "-"}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 ${
            isDark ? "bg-white/5" : "bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <MapPinned
              size={18}
              className={isDark ? "text-emerald-200" : "text-mof-primary"}
            />
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Drop-off
              </p>
              <p
                className={`mt-1 font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                {item.dropoffLocation || "-"}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 ${
            isDark ? "bg-white/5" : "bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <ClipboardList
              size={18}
              className={isDark ? "text-emerald-200" : "text-mof-primary"}
            />
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Created
              </p>
              <p
                className={`mt-1 font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                {formatCreatedDate(item.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Booking History page.
 *
 * Shows the authenticated user's daily tickets, waiting-list records,
 * and archived booking records.
 */
export default function BookingHistory() {
  const { isDark } = useTheme();

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);

        const data = await apiFetch("/api/booking/history");

        setHistory(data.history || []);
      } catch (error) {
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, []);

  return (
    <DashboardShell>
      <div className="mb-6">
        <a
          href="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-bold ${
            isDark
              ? "text-slate-300 hover:text-white"
              : "text-slate-600 hover:text-mof-primary"
          }`}
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </a>
      </div>

      <section
        className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 ${
          isDark
            ? "border border-white/10 bg-[#3e5048]"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div
          className={`pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[18px] ${
            isDark ? "border-white/5" : "border-emerald-50"
          }`}
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-white/80" : "text-mof-primary"
              }`}
            >
              Transport Records
            </p>

            <h1
              className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Booking History
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              View your confirmed tickets, waiting-list records, and archived
              transport bookings.
            </p>
          </div>

          <div
            className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
              isDark
                ? "bg-white/15 text-emerald-200"
                : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <History size={30} />
          </div>
        </div>
      </section>

      {isLoading && (
        <section
          className={`mt-6 rounded-3xl p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="text-sm font-bold">Loading booking history...</p>
        </section>
      )}

      {!isLoading && history.length === 0 && (
        <section
          className={`mt-6 rounded-3xl p-6 text-center ${
            isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
          }`}
        >
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
              isDark
                ? "bg-white/10 text-emerald-200"
                : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <TicketCheck size={26} />
          </div>

          <h2
            className={`mt-4 text-xl font-black ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            No bookings yet
          </h2>

          <p
            className={`mx-auto mt-2 max-w-md text-sm leading-6 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Your booking history will appear here after you reserve a bus ticket
            or join the waiting list.
          </p>

          <a
            href="/book"
            className={`mt-6 inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition ${
              isDark
                ? "bg-white text-slate-950 hover:bg-emerald-100"
                : "bg-mof-primary text-white hover:bg-mof-primary-container"
            }`}
          >
            Book ticket now
          </a>
        </section>
      )}

      {!isLoading && history.length > 0 && (
        <section className="mt-6 space-y-4">
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} isDark={isDark} />
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
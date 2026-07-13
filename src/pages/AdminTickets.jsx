import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Mail,
  MapPinned,
  Phone,
  Search,
  TicketCheck,
  UserRound,
  UsersRound,
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

function getStatusClass(status, isDark) {
  if (status === "confirmed") {
    return isDark
      ? "bg-emerald-500/10 text-emerald-200"
      : "bg-emerald-50 text-mof-primary";
  }

  if (status === "cancelled") {
    return isDark
      ? "bg-red-500/10 text-red-200"
      : "bg-red-50 text-red-700";
  }

  if (status === "waiting") {
    return isDark
      ? "bg-amber-500/10 text-amber-200"
      : "bg-amber-50 text-amber-800";
  }

  return isDark
    ? "bg-white/10 text-slate-200"
    : "bg-slate-100 text-slate-700";
}

function AdminRecordCard({ record, type, isDark }) {
  const profile = record.profiles;
  const isWaiting = type === "waiting";

  return (
    <article
      className={`rounded-3xl p-5 ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              isDark
                ? "bg-white/10 text-emerald-200"
                : "bg-emerald-50 text-mof-primary"
            }`}
          >
            {isWaiting ? <UsersRound size={24} /> : <TicketCheck size={24} />}
          </div>

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              {isWaiting ? "Waiting Position" : "Ticket Number"}
            </p>

            <h2
              className={`mt-1 text-3xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {isWaiting
                ? `#${record.waiting_position}`
                : String(record.ticket_number).padStart(2, "0")}
            </h2>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {profile?.full_name || "Unknown user"}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${getStatusClass(
            record.status,
            isDark
          )}`}
        >
          {record.status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoPill
          label="Role"
          value={getRoleLabel(profile?.role)}
          icon={UserRound}
          isDark={isDark}
        />

        <InfoPill
          label="Staff ID"
          value={profile?.staff_id || "-"}
          icon={ClipboardList}
          isDark={isDark}
        />

        <InfoPill
          label="Division"
          value={profile?.division || "-"}
          icon={UsersRound}
          isDark={isDark}
        />

        <InfoPill
          label="Email"
          value={profile?.email || "-"}
          icon={Mail}
          isDark={isDark}
        />

        <InfoPill
          label="Phone"
          value={profile?.phone || "-"}
          icon={Phone}
          isDark={isDark}
        />

        <InfoPill
          label="Drop-off"
          value={record.dropoff_location || "-"}
          icon={MapPinned}
          isDark={isDark}
        />
      </div>
    </article>
  );
}

function InfoPill({ label, value, icon: Icon, isDark }) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        isDark ? "bg-white/5" : "bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon
          size={18}
          className={isDark ? "text-emerald-200" : "text-mof-primary"}
        />
        <div className="min-w-0">
          <p
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-black ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Tickets page.
 *
 * Allows admin users to view today's tickets and waiting-list records.
 */
export default function AdminTickets() {
  const { isDark } = useTheme();

  const [tickets, setTickets] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [travelDate, setTravelDate] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      try {
        setIsLoading(true);

        const data = await apiFetch("/api/admin/tickets");

        setTickets(data.tickets || []);
        setWaitingList(data.waitingList || []);
        setTravelDate(data.travelDate || "");
      } catch (error) {
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTickets();
  }, []);

  const visibleRecords = activeTab === "tickets" ? tickets : waitingList;

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return visibleRecords;
    }

    return visibleRecords.filter((record) => {
      const profile = record.profiles;

      return [
        profile?.full_name,
        profile?.email,
        profile?.staff_id,
        profile?.division,
        profile?.phone,
        record.bus_route,
        record.dropoff_location,
        record.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [searchTerm, visibleRecords]);

  return (
    <DashboardShell>
      <div className="mb-6">
        <a
          href="/admin"
          className={`inline-flex items-center gap-2 text-sm font-bold ${
            isDark
              ? "text-slate-300 hover:text-white"
              : "text-slate-600 hover:text-mof-primary"
          }`}
        >
          <ArrowLeft size={17} />
          Back to admin dashboard
        </a>
      </div>

      <section
        className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 ${
          isDark
            ? "border border-white/10 bg-[#3e5048]"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-white/80" : "text-mof-primary"
              }`}
            >
              Admin Operations
            </p>

            <h1
              className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Today’s Tickets
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              View confirmed, cancelled, and waiting-list records for today’s
              staff bus service.
            </p>
          </div>

          <div
            className={`rounded-2xl px-5 py-4 ${
              isDark ? "bg-white/10 text-white" : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarDays size={22} />
              <div>
                <p className="text-xs font-black uppercase tracking-wide">
                  Travel Date
                </p>
                <p className="mt-1 text-lg font-black">
                  {formatDisplayDate(travelDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`mt-6 rounded-3xl p-4 ${
          isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("tickets")}
              className={`rounded-xl px-4 py-2 text-sm font-black ${
                activeTab === "tickets"
                  ? isDark
                    ? "bg-white text-slate-950"
                    : "bg-mof-primary text-white"
                  : isDark
                    ? "bg-white/5 text-slate-300 hover:bg-white/10"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Tickets ({tickets.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("waiting")}
              className={`rounded-xl px-4 py-2 text-sm font-black ${
                activeTab === "waiting"
                  ? isDark
                    ? "bg-white text-slate-950"
                    : "bg-mof-primary text-white"
                  : isDark
                    ? "bg-white/5 text-slate-300 hover:bg-white/10"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Waiting List ({waitingList.length})
            </button>
          </div>

          <label
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 lg:max-w-sm ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <Search size={17} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email, division..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-inherit"
            />
          </label>
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
          <p className="text-sm font-bold">Loading ticket records...</p>
        </section>
      )}

      {!isLoading && filteredRecords.length === 0 && (
        <section
          className={`mt-6 rounded-3xl p-6 text-center ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="font-black">No records found.</p>
        </section>
      )}

      {!isLoading && filteredRecords.length > 0 && (
        <section className="mt-6 space-y-4">
          {filteredRecords.map((record) => (
            <AdminRecordCard
              key={record.id}
              record={record}
              type={activeTab === "waiting" ? "waiting" : "ticket"}
              isDark={isDark}
            />
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
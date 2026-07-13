import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BusFront,
  CalendarDays,
  Download,
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

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
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

function InfoPill({ label, value, icon: Icon, isDark }) {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
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
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PassengerCard({ passenger, isDark }) {
  const profile = passenger.profile;

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
            <TicketCheck size={24} />
          </div>

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              Ticket Number
            </p>

            <h2
              className={`mt-1 text-4xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {passenger.ticket_number
                ? String(passenger.ticket_number).padStart(2, "0")
                : "-"}
            </h2>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {profile?.full_name || "Unknown passenger"}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
            isDark
              ? "bg-emerald-500/10 text-emerald-200"
              : "bg-emerald-50 text-mof-primary"
          }`}
        >
          Confirmed
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoPill
          label="Full Name"
          value={profile?.full_name}
          icon={UserRound}
          isDark={isDark}
        />

        <InfoPill
          label="Role"
          value={getRoleLabel(profile?.role)}
          icon={UsersRound}
          isDark={isDark}
        />

        <InfoPill
          label="Staff ID"
          value={profile?.staff_id || "-"}
          icon={TicketCheck}
          isDark={isDark}
        />

        <InfoPill
          label="Email"
          value={profile?.email}
          icon={Mail}
          isDark={isDark}
        />

        <InfoPill
          label="Phone"
          value={profile?.phone}
          icon={Phone}
          isDark={isDark}
        />

        <InfoPill
          label="Division"
          value={profile?.division}
          icon={UsersRound}
          isDark={isDark}
        />

        <InfoPill
          label="Bus Route"
          value={passenger.bus_route}
          icon={BusFront}
          isDark={isDark}
        />

        <InfoPill
          label="Drop-off"
          value={passenger.dropoff_location}
          icon={MapPinned}
          isDark={isDark}
        />
      </div>
    </article>
  );
}

/**
 * Admin Manifest page.
 *
 * Allows admins to view and export confirmed passengers for a travel date.
 */
export default function AdminManifest() {
  const { isDark } = useTheme();

  const [travelDate, setTravelDate] = useState(getTodayISO());
  const [manifest, setManifest] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadManifest(dateValue = travelDate) {
    try {
      setIsLoading(true);

      const data = await apiFetch(`/api/admin/manifest?date=${dateValue}`);

      setManifest(data.manifest || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadManifest(travelDate);
  }, []);

  function handleDateChange(event) {
    const nextDate = event.target.value;

    setTravelDate(nextDate);
    loadManifest(nextDate);
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
  }

  async function handleDownloadCsv() {
    try {
      const { supabase } = await import("../lib/supabaseClient");
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult.data.session?.access_token;

      if (!accessToken) {
        alert("You must be logged in to download the manifest.");
        return;
      }

      const response = await fetch(
        `/api/admin/manifest?date=${travelDate}&format=csv`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Could not download manifest.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `mof-bus-manifest-${travelDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  }

  const filteredManifest = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return manifest;
    }

    return manifest.filter((passenger) => {
      const profile = passenger.profile;

      return [
        passenger.ticket_number,
        passenger.bus_route,
        passenger.dropoff_location,
        profile?.full_name,
        profile?.email,
        profile?.phone,
        profile?.staff_id,
        profile?.division,
        profile?.role,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [manifest, searchTerm]);

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
              Passenger Manifest
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              View and export confirmed passengers for a selected travel date.
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
                  Manifest Date
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
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-center">
          <input
            type="date"
            value={travelDate}
            onChange={handleDateChange}
            className={`min-h-11 rounded-xl border px-4 text-sm font-black outline-none ${
              isDark
                ? "border-white/10 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          />

          <label
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <Search size={17} />

            <input
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search passenger, Staff ID, route, drop-off..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-inherit"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={manifest.length === 0}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDark
                ? "bg-white text-slate-950 hover:bg-emerald-100"
                : "bg-mof-primary text-white hover:bg-mof-primary-container"
            }`}
          >
            <Download size={18} />
            Export CSV
          </button>
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
          <p className="text-sm font-bold">Loading passenger manifest...</p>
        </section>
      )}

      {!isLoading && filteredManifest.length === 0 && (
        <section
          className={`mt-6 rounded-3xl p-6 text-center ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="font-black">No confirmed passengers found.</p>
        </section>
      )}

      {!isLoading && filteredManifest.length > 0 && (
        <section className="mt-6 space-y-4">
          {filteredManifest.map((passenger) => (
            <PassengerCard
              key={passenger.id}
              passenger={passenger}
              isDark={isDark}
            />
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
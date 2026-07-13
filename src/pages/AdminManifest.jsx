import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BusFront,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { BUS_ROUTE_OPTIONS } from "../constants/busRoutesList";

const ITEMS_PER_PAGE = 10;

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

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPageChange,
  isDark,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div
      className={`mt-6 rounded-3xl p-4 ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p
          className={`text-sm font-bold ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Showing {startItem} to {endItem} of {totalItems} passengers
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isDark
                ? "border-white/10 text-slate-300 hover:bg-white/10"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black transition ${
                pageNumber === currentPage
                  ? isDark
                    ? "bg-white text-slate-950"
                    : "bg-mof-primary text-white"
                  : isDark
                    ? "border border-white/10 text-slate-300 hover:bg-white/10"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isDark
                ? "border-white/10 text-slate-300 hover:bg-white/10"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Manifest page.
 *
 * Allows admins to view and export confirmed passengers for a travel date.
 *
 * Pagination:
 * - 10 records per page
 */
export default function AdminManifest() {
  const { isDark } = useTheme();

  const [travelDate, setTravelDate] = useState(getTodayISO());
  const [selectedBusRoute, setSelectedBusRoute] = useState("all");
  const [manifest, setManifest] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  async function loadManifest(
    dateValue = travelDate,
    busRouteValue = selectedBusRoute,
    showLoader = true
  ) {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      const params = new URLSearchParams({
        date: dateValue,
        busRoute: busRouteValue,
      });

      const data = await apiFetch(`/api/admin/manifest?${params.toString()}`);

      setManifest(data.manifest || []);
      setCurrentPage(1);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialManifest() {
      try {
        const params = new URLSearchParams({
          date: travelDate,
          busRoute: selectedBusRoute,
        });

        const data = await apiFetch(`/api/admin/manifest?${params.toString()}`);

        if (!isMounted) {
          return;
        }

        setManifest(data.manifest || []);
        setCurrentPage(1);
      } catch (error) {
        if (isMounted) {
          alert(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialManifest();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleDateChange(event) {
    const nextDate = event.target.value;

    setTravelDate(nextDate);
    loadManifest(nextDate, selectedBusRoute);
  }

  function handleBusRouteChange(event) {
    const nextBusRoute = event.target.value;

    setSelectedBusRoute(nextBusRoute);
    loadManifest(travelDate, nextBusRoute);
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
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
        `/api/admin/manifest?date=${encodeURIComponent(
          travelDate
        )}&busRoute=${encodeURIComponent(selectedBusRoute)}&format=csv`,
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

      const routeSlug =
        selectedBusRoute === "all"
          ? "all-routes"
          : selectedBusRoute.toLowerCase().replaceAll(" ", "-");

      link.href = url;
      link.download = `mof-bus-manifest-${travelDate}-${routeSlug}.csv`;

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

  const totalItems = filteredManifest.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedManifest = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredManifest.slice(startIndex, endIndex);
  }, [filteredManifest, currentPage]);

  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  function handlePageChange(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    setCurrentPage(pageNumber);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

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
              View and export confirmed passengers for a selected travel date
              and bus route.
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
        <div className="grid gap-3 lg:grid-cols-[220px_220px_1fr_auto] lg:items-center">
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

          <select
            value={selectedBusRoute}
            onChange={handleBusRouteChange}
            className={`min-h-11 rounded-xl border px-4 text-sm font-black outline-none ${
              isDark
                ? "border-white/10 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <option value="all">All Bus Routes</option>
            {BUS_ROUTE_OPTIONS.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>

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
        <>
          <section className="mt-6 space-y-4">
            {paginatedManifest.map((passenger) => (
              <PassengerCard
                key={passenger.id}
                passenger={passenger}
                isDark={isDark}
              />
            ))}
          </section>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={handlePageChange}
            isDark={isDark}
          />
        </>
      )}
    </DashboardShell>
  );
}
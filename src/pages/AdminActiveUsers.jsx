import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BusFront,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  MapPinned,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import { useTheme } from "../context/useTheme";
import { useToast } from "../context/useToast";
import { supabase } from "../lib/supabaseClient";

const ITEMS_PER_PAGE = 10;
const ONLINE_WINDOW_MINUTES = 5;
const RECENT_WINDOW_MINUTES = 30;

function getRoleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "staff") return "Staff";
  if (role === "intern_nsp") return "Intern/NSP";
  return "User";
}

function getStatusLabel(status) {
  if (status === "online") return "Online";
  if (status === "recent") return "Recently Active";
  return "Offline";
}

function getPresenceStatus(lastSeenAt) {
  if (!lastSeenAt) {
    return "offline";
  }

  const lastSeenTime = new Date(lastSeenAt).getTime();
  const diffMinutes = (Date.now() - lastSeenTime) / 1000 / 60;

  if (diffMinutes <= ONLINE_WINDOW_MINUTES) {
    return "online";
  }

  if (diffMinutes <= RECENT_WINDOW_MINUTES) {
    return "recent";
  }

  return "offline";
}

function mapProfile(profile) {
  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    staff_id: profile.staff_id,
    role: profile.role,
    division: profile.division,
    bus_route: profile.bus_route,
    dropoff_location: profile.dropoff_location,
    is_disabled: profile.is_disabled,
  };
}

function formatLastSeen(dateValue) {
  if (!dateValue) {
    return "Not available";
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

function InfoPill({ label, value, icon: Icon, isDark }) {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <Icon
          size={18}
          aria-hidden="true"
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

function StatusBadge({ status, isDark }) {
  const label = getStatusLabel(status);

  const className =
    status === "online"
      ? isDark
        ? "bg-emerald-500/10 text-emerald-200"
        : "bg-emerald-50 text-emerald-700"
      : status === "recent"
        ? isDark
          ? "bg-amber-500/10 text-amber-200"
          : "bg-amber-50 text-amber-700"
        : isDark
          ? "bg-slate-500/10 text-slate-300"
          : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

function ActiveUserCard({ record, isDark }) {
  const profile = record.profile;

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
            <Activity size={24} aria-hidden="true" />
          </div>

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              User Presence
            </p>

            <h2
              className={`mt-1 text-2xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {profile?.full_name || "Profile not found"}
            </h2>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Last seen: {formatLastSeen(record.lastSeenAt)}
            </p>
          </div>
        </div>

        <StatusBadge status={record.status} isDark={isDark} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoPill
          label="Role"
          value={getRoleLabel(profile?.role)}
          icon={UserRound}
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
          value={profile?.bus_route}
          icon={BusFront}
          isDark={isDark}
        />

        <InfoPill
          label="Drop-off"
          value={profile?.dropoff_location}
          icon={MapPinned}
          isDark={isDark}
        />

        <InfoPill
          label="Current Page"
          value={record.currentPage}
          icon={Activity}
          isDark={isDark}
        />

        <InfoPill
          label="Last Seen"
          value={formatLastSeen(record.lastSeenAt)}
          icon={Clock3}
          isDark={isDark}
        />

        <InfoPill
          label="Account Status"
          value={profile?.is_disabled ? "Disabled" : "Active"}
          icon={ShieldCheck}
          isDark={isDark}
        />
      </div>
    </article>
  );
}

function SummaryCard({ label, value, description, icon: Icon, isDark }) {
  return (
    <section
      className={`rounded-3xl p-5 ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isDark
              ? "bg-white/10 text-emerald-200"
              : "bg-emerald-50 text-mof-primary"
          }`}
        >
          <Icon size={22} aria-hidden="true" />
        </div>

        <div>
          <p
            className={`text-xs font-black uppercase tracking-wide ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-1 text-2xl font-black ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {value}
          </p>

          <p
            className={`mt-1 text-sm font-semibold ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </section>
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
          Showing {startItem} to {endItem} of {totalItems} users
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
            <ChevronLeft size={16} aria-hidden="true" />
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
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminActiveUsers() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    online: 0,
    recent: 0,
    offline: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadActiveUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: presenceRows, error: presenceError } = await supabase
        .from("user_presence")
        .select("user_id, last_seen_at, current_page, user_agent, updated_at")
        .order("last_seen_at", { ascending: false });

      if (presenceError) {
        throw new Error(presenceError.message);
      }

      const userIds = [
        ...new Set((presenceRows || []).map((row) => row.user_id).filter(Boolean)),
      ];

      let profiles = [];

      if (userIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, phone, staff_id, role, division, bus_route, dropoff_location, is_disabled"
          )
          .in("id", userIds);

        if (profileError) {
          throw new Error(profileError.message);
        }

        profiles = profileRows || [];
      }

      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

      const mappedUsers = (presenceRows || []).map((presence) => {
        const profile = profileById.get(presence.user_id) || null;

        return {
          userId: presence.user_id,
          lastSeenAt: presence.last_seen_at,
          currentPage: presence.current_page,
          userAgent: presence.user_agent,
          status: getPresenceStatus(presence.last_seen_at),
          profile: profile ? mapProfile(profile) : null,
        };
      });

      const mappedSummary = mappedUsers.reduce(
        (accumulator, record) => {
          accumulator.total += 1;

          if (record.status === "online") {
            accumulator.online += 1;
          } else if (record.status === "recent") {
            accumulator.recent += 1;
          } else {
            accumulator.offline += 1;
          }

          return accumulator;
        },
        {
          total: 0,
          online: 0,
          recent: 0,
          offline: 0,
        }
      );

      setUsers(mappedUsers);
      setSummary(mappedSummary);
      setCurrentPage(1);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load active users",
        message: error.message || "Failed to load active users.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadActiveUsers();
    }, 0);

    const intervalId = window.setInterval(() => {
      loadActiveUsers();
    }, 60000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadActiveUsers]);

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  }

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((record) => {
      const profile = record.profile;

      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;

      const matchesSearch =
        !query ||
        [
          profile?.full_name,
          profile?.email,
          profile?.phone,
          profile?.staff_id,
          profile?.role,
          profile?.division,
          profile?.bus_route,
          profile?.dropoff_location,
          record.currentPage,
          record.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [users, searchTerm, statusFilter]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const safeCurrentPage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const paginatedUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, safeCurrentPage]);

  const startItem =
    totalItems === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems);

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
        <Link
          to="/admin"
          className={`inline-flex items-center gap-2 text-sm font-bold ${
            isDark
              ? "text-slate-300 hover:text-white"
              : "text-slate-600 hover:text-mof-primary"
          }`}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to admin dashboard
        </Link>
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
              Admin Monitoring
            </p>

            <h1
              className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Active Users
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              View users who are currently online or recently active in the MoF
              Bus Portal.
            </p>
          </div>

          <div
            className={`rounded-2xl px-5 py-4 ${
              isDark ? "bg-white/10 text-white" : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <Activity size={22} aria-hidden="true" />

              <div>
                <p className="text-xs font-black uppercase tracking-wide">
                  Online Now
                </p>

                <p className="mt-1 text-lg font-black">{summary.online}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Tracked"
          value={summary.total}
          description="Users with presence records"
          icon={UsersRound}
          isDark={isDark}
        />
        <SummaryCard
          label="Online"
          value={summary.online}
          description="Seen within 5 minutes"
          icon={Activity}
          isDark={isDark}
        />
        <SummaryCard
          label="Recently Active"
          value={summary.recent}
          description="Seen within 30 minutes"
          icon={Clock3}
          isDark={isDark}
        />
        <SummaryCard
          label="Offline"
          value={summary.offline}
          description="Older than 30 minutes"
          icon={UserRound}
          isDark={isDark}
        />
      </section>

      <section
        className={`mt-6 rounded-3xl p-4 ${
          isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <Search size={17} aria-hidden="true" />

            <input
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search name, email, role, division, route, page..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-inherit"
            />
          </label>

          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className={`min-h-11 rounded-xl border px-4 text-sm font-bold outline-none ${
              isDark
                ? "border-white/10 bg-slate-950 text-white"
                : "border-slate-200 bg-slate-50 text-slate-950"
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="recent">Recently Active</option>
            <option value="offline">Offline</option>
          </select>
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
          <p className="text-sm font-bold">Loading active users...</p>
        </section>
      )}

      {!isLoading && filteredUsers.length === 0 && (
        <section
          className={`mt-6 rounded-3xl p-6 text-center ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="font-black">No active users found.</p>
        </section>
      )}

      {!isLoading && filteredUsers.length > 0 && (
        <>
          <section className="mt-6 space-y-4">
            {paginatedUsers.map((record) => (
              <ActiveUserCard
                key={record.userId}
                record={record}
                isDark={isDark}
              />
            ))}
          </section>

          <PaginationControls
            currentPage={safeCurrentPage}
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
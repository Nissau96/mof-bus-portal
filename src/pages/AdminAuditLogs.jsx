import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import { useTheme } from "../context/useTheme";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";

const ITEMS_PER_PAGE = 10;

function formatDateTime(dateValue) {
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

function formatActionLabel(action) {
  if (!action) {
    return "Unknown action";
  }

  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stringifyDetails(details) {
  if (!details) {
    return "No details available.";
  }

  try {
    if (typeof details === "string") {
      return details;
    }

    return JSON.stringify(details, null, 2);
  } catch {
    return "Could not display details.";
  }
}

function getActionClass(action, isDark) {
  if (action?.includes("failed")) {
    return isDark
      ? "bg-red-500/10 text-red-200"
      : "bg-red-50 text-red-700";
  }

  if (action?.includes("admin")) {
    return isDark
      ? "bg-purple-500/10 text-purple-200"
      : "bg-purple-50 text-purple-700";
  }

  if (action?.includes("cancel")) {
    return isDark
      ? "bg-amber-500/10 text-amber-200"
      : "bg-amber-50 text-amber-800";
  }

  return isDark
    ? "bg-emerald-500/10 text-emerald-200"
    : "bg-emerald-50 text-mof-primary";
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
            className={`mt-1 wrap-break-word text-sm font-black ${
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

function AuditLogCard({ log, isDark }) {
  const profile = log.profile;

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
            <ShieldCheck size={24} />
          </div>

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              Audit Event
            </p>

            <h2
              className={`mt-1 text-2xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {formatActionLabel(log.action)}
            </h2>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {formatDateTime(log.created_at)}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${getActionClass(
            log.action,
            isDark
          )}`}
        >
          {log.action}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoPill
          label="User"
          value={profile?.full_name || "System / Unknown"}
          icon={UserRound}
          isDark={isDark}
        />

        <InfoPill
          label="Role"
          value={getRoleLabel(profile?.role)}
          icon={BadgeCheck}
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
          icon={FileSearch}
          isDark={isDark}
        />
      </div>

      <div
        className={`mt-4 rounded-2xl p-4 ${
          isDark ? "bg-white/5" : "bg-slate-50"
        }`}
      >
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Details
        </p>

        <pre
          className={`mt-3 max-h-72 overflow-auto whitespace-pre-wrap wrap-break-word text-xs font-semibold leading-6 ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}
        >
          {stringifyDetails(log.details)}
        </pre>
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
          Showing {startItem} to {endItem} of {totalItems} audit logs
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
 * Admin Audit Logs page.
 *
 * Allows admin users to view recent system audit activity.
 *
 * Pagination:
 * - 10 records per page
 */
export default function AdminAuditLogs() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await apiFetch("/api/admin/audit-logs");

      setLogs(data.logs || []);
      setActions(data.actions || []);
      setCurrentPage(1);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load audit logs",
        message: error.message || "Failed to load system activity records.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAuditLogs();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAuditLogs]);

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleActionFilterChange(action) {
    setActionFilter(action);
    setCurrentPage(1);
  }

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const profile = log.profile;
      const detailsText = stringifyDetails(log.details);

      const matchesSearch =
        !query ||
        [
          log.action,
          profile?.full_name,
          profile?.email,
          profile?.staff_id,
          profile?.division,
          detailsText,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const safeCurrentPage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const paginatedLogs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, safeCurrentPage]);

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
          <ArrowLeft size={17} />
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
              Admin Operations
            </p>

            <h1
              className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Audit Logs
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Review recent booking, cancellation, promotion, user-management,
              and system-settings activity.
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
                  Loaded Logs
                </p>

                <p className="mt-1 text-lg font-black">{logs.length}</p>
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
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
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
              placeholder="Search action, user, staff ID, division, details..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-inherit"
            />
          </label>

          <select
            value={actionFilter}
            onChange={(event) => handleActionFilterChange(event.target.value)}
            className={`min-h-11 rounded-xl border px-4 text-sm font-black outline-none ${
              isDark
                ? "border-white/10 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <option value="all">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {formatActionLabel(action)}
              </option>
            ))}
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
          <p className="text-sm font-bold">Loading audit logs...</p>
        </section>
      )}

      {!isLoading && filteredLogs.length === 0 && (
        <section
          className={`mt-6 rounded-3xl p-6 text-center ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="font-black">No audit logs found.</p>
        </section>
      )}

      {!isLoading && filteredLogs.length > 0 && (
        <>
          <section className="mt-6 space-y-4">
            {paginatedLogs.map((log) => (
              <AuditLogCard key={log.id} log={log} isDark={isDark} />
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
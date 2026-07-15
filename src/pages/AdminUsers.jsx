import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BusFront,
  Building2,
  ChevronLeft,
  ChevronRight,
  IdCard,
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
import { apiFetch } from "../lib/api";

const ITEMS_PER_PAGE = 10;

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

function getRoleClass(role, isDark) {
  if (role === "admin") {
    return isDark
      ? "bg-purple-500/10 text-purple-200"
      : "bg-purple-50 text-purple-700";
  }

  if (role === "intern_nsp") {
    return isDark
      ? "bg-blue-500/10 text-blue-200"
      : "bg-blue-50 text-blue-700";
  }

  return isDark
    ? "bg-emerald-500/10 text-emerald-200"
    : "bg-emerald-50 text-mof-primary";
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
  }).format(date);
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

function UserCard({ user, isDark, onToggleStatus, isUpdating }) {
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
            <UserRound size={24} />
          </div>

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              Registered User
            </p>

            <h2
              className={`mt-1 text-2xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {user.full_name || "Unnamed user"}
            </h2>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${getRoleClass(
              user.role,
              isDark
            )}`}
          >
            {getRoleLabel(user.role)}
          </span>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
              user.is_disabled
                ? isDark
                  ? "bg-red-500/10 text-red-200"
                  : "bg-red-50 text-red-700"
                : isDark
                  ? "bg-emerald-500/10 text-emerald-200"
                  : "bg-emerald-50 text-mof-primary"
            }`}
          >
            {user.is_disabled ? "Disabled" : "Active"}
          </span>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggleStatus(user)}
            className={`inline-flex min-h-9 items-center justify-center rounded-full px-4 text-xs font-black uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
              user.is_disabled
                ? isDark
                  ? "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  : "bg-emerald-50 text-mof-primary hover:bg-emerald-100"
                : isDark
                  ? "bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {isUpdating
              ? "Updating..."
              : user.is_disabled
                ? "Reactivate"
                : "Disable"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoPill
          label="Staff ID"
          value={user.staff_id || "-"}
          icon={IdCard}
          isDark={isDark}
        />

        <InfoPill label="Phone" value={user.phone} icon={Phone} isDark={isDark} />

        <InfoPill
          label="Division"
          value={user.division}
          icon={Building2}
          isDark={isDark}
        />

        <InfoPill
          label="Bus Route"
          value={user.bus_route}
          icon={BusFront}
          isDark={isDark}
        />

        <InfoPill
          label="Drop-off"
          value={user.dropoff_location}
          icon={MapPinned}
          isDark={isDark}
        />

        <InfoPill
          label="Created"
          value={formatCreatedDate(user.created_at)}
          icon={BadgeCheck}
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
 * Admin Users page.
 *
 * Allows admin users to view all registered users and enable/disable accounts.
 */
export default function AdminUsers() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await apiFetch("/api/admin/users");

      setUsers(data.users || []);
      setCurrentPage(1);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load users",
        message: error.message || "Failed to load registered users.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(role) {
    setRoleFilter(role);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(status) {
    setStatusFilter(status);
    setCurrentPage(1);
  }

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [
          user.full_name,
          user.email,
          user.staff_id,
          user.phone,
          user.division,
          user.bus_route,
          user.dropoff_location,
          user.role,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.is_disabled) ||
        (statusFilter === "disabled" && user.is_disabled);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

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

  const activeUsers = users.filter((user) => !user.is_disabled).length;
  const disabledUsers = users.filter((user) => user.is_disabled).length;

  async function handleToggleUserStatus(user) {
    const nextDisabledStatus = !user.is_disabled;

    const confirmed = window.confirm(
      nextDisabledStatus
        ? `Are you sure you want to disable ${user.full_name}?`
        : `Are you sure you want to reactivate ${user.full_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingUserId(user.id);

      const data = await apiFetch("/api/admin/update-user-status", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          isDisabled: nextDisabledStatus,
        }),
      });

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === data.user.id ? data.user : currentUser
        )
      );

      showToast({
        type: "success",
        title: nextDisabledStatus ? "User disabled" : "User reactivated",
        message:
          data.message ||
          `The user account has been ${
            nextDisabledStatus ? "disabled" : "reactivated"
          }.`,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not update user",
        message: error.message || "Failed to update the user account status.",
      });
    } finally {
      setUpdatingUserId(null);
    }
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
              User Management
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              View registered staff, interns, NSP users, assigned routes, and
              account status.
            </p>
          </div>

          <div
            className={`rounded-2xl px-5 py-4 ${
              isDark ? "bg-white/10 text-white" : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <UsersRound size={22} />
              <div>
                <p className="text-xs font-black uppercase tracking-wide">
                  Total Users
                </p>
                <p className="mt-1 text-lg font-black">{users.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Total Users", users.length, UsersRound],
          ["Active Users", activeUsers, ShieldCheck],
          ["Disabled Users", disabledUsers, BadgeCheck],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className={`rounded-3xl p-5 ${
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
                <Icon size={22} />
              </div>

              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
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
                  {isLoading ? "..." : value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section
        className={`mt-6 rounded-3xl p-4 ${
          isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
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
              placeholder="Search name, email, division, route..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-inherit"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All Roles"],
              ["staff", "Staff"],
              ["intern_nsp", "Intern/NSP"],
              ["admin", "Admin"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRoleFilterChange(value)}
                className={`rounded-xl px-4 py-2 text-sm font-black ${
                  roleFilter === value
                    ? isDark
                      ? "bg-white text-slate-950"
                      : "bg-mof-primary text-white"
                    : isDark
                      ? "bg-white/5 text-slate-300 hover:bg-white/10"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All Status"],
              ["active", "Active"],
              ["disabled", "Disabled"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusFilterChange(value)}
                className={`rounded-xl px-4 py-2 text-sm font-black ${
                  statusFilter === value
                    ? isDark
                      ? "bg-white text-slate-950"
                      : "bg-mof-primary text-white"
                    : isDark
                      ? "bg-white/5 text-slate-300 hover:bg-white/10"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
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
          <p className="text-sm font-bold">Loading users...</p>
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
          <p className="font-black">No users found.</p>
        </section>
      )}

      {!isLoading && filteredUsers.length > 0 && (
        <>
          <section className="mt-6 space-y-4">
            {paginatedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isDark={isDark}
                onToggleStatus={handleToggleUserStatus}
                isUpdating={updatingUserId === user.id}
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BusFront,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Mail,
  MapPinned,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
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

function PrivilegedUserCard({ record, isDark, onRemove, isRemoving }) {
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
            <ShieldCheck size={24} />
          </div>

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              Privileged User
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
              Staff ID: {record.staff_id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
              isDark
                ? "bg-emerald-500/10 text-emerald-200"
                : "bg-emerald-50 text-mof-primary"
            }`}
          >
            Priority
          </span>

          <button
            type="button"
            disabled={isRemoving}
            onClick={() => onRemove(record)}
            className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-full px-4 text-xs font-black uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDark
                ? "bg-red-500/10 text-red-200 hover:bg-red-500/20"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            <Trash2 size={14} />
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
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
          label="Staff ID"
          value={record.staff_id}
          icon={IdCard}
          isDark={isDark}
        />

        <InfoPill
          label="Added"
          value={formatCreatedDate(record.created_at)}
          icon={BadgeCheck}
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
          Showing {startItem} to {endItem} of {totalItems} privileged users
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
 * Admin Privileged Users page.
 *
 * Allows admins to manage privileged staff users.
 *
 * Pagination:
 * - 10 records per page
 */
export default function AdminPrivilegedUsers() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [privilegedUsers, setPrivilegedUsers] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPrivilegedUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await apiFetch("/api/admin/privileged-users");

      setPrivilegedUsers(data.privilegedUsers || []);
      setCurrentPage(1);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load privileged users",
        message: error.message || "Failed to load privileged users.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPrivilegedUsers();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPrivilegedUsers]);

  async function handleAddPrivilegedUser(event) {
    event.preventDefault();

    const cleanedStaffId = staffId.trim();

    if (!cleanedStaffId) {
      showToast({
        type: "warning",
        title: "Staff ID required",
        message: "Enter a Staff ID before adding a privileged user.",
      });
      return;
    }

    try {
      setIsAdding(true);

      const data = await apiFetch("/api/admin/privileged-users", {
        method: "POST",
        body: JSON.stringify({
          staffId: cleanedStaffId,
        }),
      });

      setPrivilegedUsers((currentRecords) => [
        data.privilegedUser,
        ...currentRecords,
      ]);
      setStaffId("");
      setCurrentPage(1);

      showToast({
        type: "success",
        title: "Privileged user added",
        message: data.message || "The staff member has been added successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not add privileged user",
        message: error.message || "Failed to add the privileged user.",
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemovePrivilegedUser(record) {
    const confirmed = window.confirm(
      `Remove Staff ID ${record.staff_id} from the privileged users list?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(record.id);

      const data = await apiFetch("/api/admin/privileged-users", {
        method: "DELETE",
        body: JSON.stringify({
          id: record.id,
        }),
      });

      setPrivilegedUsers((currentRecords) =>
        currentRecords.filter(
          (currentRecord) => currentRecord.id !== data.removedId
        )
      );
      setCurrentPage(1);

      showToast({
        type: "success",
        title: "Privileged user removed",
        message:
          data.message || "The staff member has been removed successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not remove privileged user",
        message: error.message || "Failed to remove the privileged user.",
      });
    } finally {
      setRemovingId(null);
    }
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return privilegedUsers;
    }

    return privilegedUsers.filter((record) => {
      const profile = record.profile;

      return [
        record.staff_id,
        profile?.full_name,
        profile?.email,
        profile?.phone,
        profile?.division,
        profile?.bus_route,
        profile?.dropoff_location,
        profile?.role,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [privilegedUsers, searchTerm]);

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
              Privileged Users
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Manage staff who should receive priority consideration in the
              daily bus booking process.
            </p>
          </div>

          <div
            className={`rounded-2xl px-5 py-4 ${
              isDark ? "bg-white/10 text-white" : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} />

              <div>
                <p className="text-xs font-black uppercase tracking-wide">
                  Privileged Users
                </p>

                <p className="mt-1 text-lg font-black">
                  {privilegedUsers.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`mt-6 rounded-3xl p-5 sm:p-6 ${
          isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
        }`}
      >
        <form
          onSubmit={handleAddPrivilegedUser}
          className="grid gap-3 lg:grid-cols-[1fr_auto]"
        >
          <label
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <IdCard size={17} />

            <input
              type="text"
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              placeholder="Enter Staff ID to add privileged user"
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-inherit"
            />
          </label>

          <button
            type="submit"
            disabled={isAdding}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDark
                ? "bg-white text-slate-950 hover:bg-emerald-100"
                : "bg-mof-primary text-white hover:bg-mof-primary-container"
            }`}
          >
            <Plus size={18} />
            {isAdding ? "Adding..." : "Add Privileged User"}
          </button>
        </form>
      </section>

      <section
        className={`mt-6 rounded-3xl p-4 ${
          isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
        }`}
      >
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
            placeholder="Search name, email, Staff ID, division, route..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-inherit"
          />
        </label>
      </section>

      {isLoading && (
        <section
          className={`mt-6 rounded-3xl p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="text-sm font-bold">Loading privileged users...</p>
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
          <p className="font-black">No privileged users found.</p>
        </section>
      )}

      {!isLoading && filteredUsers.length > 0 && (
        <>
          <section className="mt-6 space-y-4">
            {paginatedUsers.map((record) => (
              <PrivilegedUserCard
                key={record.id}
                record={record}
                isDark={isDark}
                onRemove={handleRemovePrivilegedUser}
                isRemoving={removingId === record.id}
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
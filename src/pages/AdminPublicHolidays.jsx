import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import { useTheme } from "../context/useTheme";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";

const ITEMS_PER_PAGE = 10;

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

function HolidayCard({ holiday, isDark, onRemove, isRemoving }) {
  return (
    <article
      className={`rounded-3xl p-5 ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              isDark
                ? "bg-white/10 text-emerald-200"
                : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <CalendarDays size={24} />
          </div>

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-emerald-200" : "text-mof-primary"
              }`}
            >
              Public Holiday
            </p>

            <h2
              className={`mt-1 text-2xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {holiday.name}
            </h2>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Observed:{" "}
              {formatDisplayDate(holiday.observed_date || holiday.holiday_date)}
            </p>

            {holiday.base_date &&
              holiday.base_date !==
                (holiday.observed_date || holiday.holiday_date) && (
                <p
                  className={`mt-1 text-xs font-bold ${
                    isDark ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  Actual date: {formatDisplayDate(holiday.base_date)}
                </p>
              )}
          </div>
        </div>

        <button
          type="button"
          disabled={isRemoving}
          onClick={() => onRemove(holiday)}
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-xs font-black uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isDark
              ? "bg-red-500/10 text-red-200 hover:bg-red-500/20"
              : "bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
          <Trash2 size={14} />
          {isRemoving ? "Removing..." : "Remove"}
        </button>
      </div>

      <div
        className={`mt-5 rounded-2xl p-4 ${
          isDark ? "bg-white/5" : "bg-slate-50"
        }`}
      >
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Added
        </p>

        <p
          className={`mt-1 text-sm font-black ${
            isDark ? "text-white" : "text-slate-950"
          }`}
        >
          {formatCreatedDate(holiday.created_at)}
        </p>
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
          Showing {startItem} to {endItem} of {totalItems} public holidays
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
 * Admin Public Holidays page.
 *
 * Allows admins to manage dates where booking should be blocked.
 *
 * Pagination:
 * - 10 records per page
 */
export default function AdminPublicHolidays() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [holidays, setHolidays] = useState([]);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [generateYear, setGenerateYear] = useState(
    String(new Date().getFullYear())
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const loadHolidays = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await apiFetch("/api/admin/public-holidays");

      setHolidays(data.holidays || []);
      setCurrentPage(1);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load public holidays",
        message: error.message || "Failed to load public holidays.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  async function handleGenerateYear(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      `Generate Ghana public holidays for ${generateYear}? Existing matching observed dates will be updated.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsGenerating(true);

      const data = await apiFetch("/api/admin/public-holidays", {
        method: "POST",
        body: JSON.stringify({
          mode: "generate_year",
          year: generateYear,
        }),
      });

      await loadHolidays();

      showToast({
        type: "success",
        title: "Holidays generated",
        message:
          data.message ||
          `Ghana public holidays for ${generateYear} have been generated.`,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not generate holidays",
        message: error.message || "Failed to generate public holidays.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAddHoliday(event) {
    event.preventDefault();

    if (!holidayDate) {
      showToast({
        type: "warning",
        title: "Holiday date required",
        message: "Select a public holiday date.",
      });
      return;
    }

    if (!holidayName.trim()) {
      showToast({
        type: "warning",
        title: "Holiday name required",
        message: "Enter the public holiday name.",
      });
      return;
    }

    try {
      setIsAdding(true);

      const data = await apiFetch("/api/admin/public-holidays", {
        method: "POST",
        body: JSON.stringify({
          holidayDate,
          name: holidayName.trim(),
        }),
      });

      setHolidays((currentHolidays) => [data.holiday, ...currentHolidays]);
      setHolidayDate("");
      setHolidayName("");
      setCurrentPage(1);

      showToast({
        type: "success",
        title: "Holiday added",
        message: data.message || "The public holiday has been added.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not add holiday",
        message: error.message || "Failed to add the public holiday.",
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveHoliday(holiday) {
    const confirmed = window.confirm(
      `Remove ${holiday.name} from public holidays?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(holiday.id);

      const data = await apiFetch("/api/admin/public-holidays", {
        method: "DELETE",
        body: JSON.stringify({
          id: holiday.id,
        }),
      });

      setHolidays((currentHolidays) =>
        currentHolidays.filter(
          (currentHoliday) => currentHoliday.id !== data.removedId
        )
      );
      setCurrentPage(1);

      showToast({
        type: "success",
        title: "Holiday removed",
        message: data.message || "The public holiday has been removed.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not remove holiday",
        message: error.message || "Failed to remove the public holiday.",
      });
    } finally {
      setRemovingId(null);
    }
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  const filteredHolidays = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return holidays;
    }

    return holidays.filter((holiday) =>
      [
        holiday.name,
        holiday.holiday_date,
        holiday.observed_date,
        holiday.base_date,
        holiday.holiday_type,
        holiday.source,
        holiday.year,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [holidays, searchTerm]);

  const totalItems = filteredHolidays.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const safeCurrentPage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const paginatedHolidays = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredHolidays.slice(startIndex, endIndex);
  }, [filteredHolidays, safeCurrentPage]);

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
              Public Holidays
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Manage dates where staff bus booking should be closed.
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
                  Holiday Records
                </p>

                <p className="mt-1 text-lg font-black">{holidays.length}</p>
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className={`text-xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Generate Ghana Holidays
            </h2>

            <p
              className={`mt-1 text-sm leading-6 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Generate fixed and calculated Ghana statutory holidays for a
              selected year. Eid holidays should still be added manually when
              officially announced.
            </p>
          </div>

          <form
            onSubmit={handleGenerateYear}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="number"
              min="2025"
              max="2100"
              value={generateYear}
              onChange={(event) => setGenerateYear(event.target.value)}
              className={`min-h-12 rounded-xl border px-4 text-sm font-black outline-none ${
                isDark
                  ? "border-white/10 bg-white/5 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            />

            <button
              type="submit"
              disabled={isGenerating}
              className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isDark
                  ? "bg-white text-slate-950 hover:bg-emerald-100"
                  : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
            >
              {isGenerating ? "Generating..." : "Generate Year"}
            </button>
          </form>
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
          onSubmit={handleAddHoliday}
          className="grid gap-3 lg:grid-cols-[220px_1fr_auto]"
        >
          <input
            type="date"
            value={holidayDate}
            onChange={(event) => setHolidayDate(event.target.value)}
            className={`min-h-12 rounded-xl border px-4 text-sm font-black outline-none ${
              isDark
                ? "border-white/10 bg-white/5 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          />

          <input
            type="text"
            value={holidayName}
            onChange={(event) => setHolidayName(event.target.value)}
            placeholder="Enter public holiday name"
            className={`min-h-12 rounded-xl border px-4 text-sm font-semibold outline-none ${
              isDark
                ? "border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                : "border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-500"
            }`}
          />

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
            {isAdding ? "Adding..." : "Add Holiday"}
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
            placeholder="Search holiday name or date..."
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
          <p className="text-sm font-bold">Loading public holidays...</p>
        </section>
      )}

      {!isLoading && filteredHolidays.length === 0 && (
        <section
          className={`mt-6 rounded-3xl p-6 text-center ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="font-black">No public holidays found.</p>
        </section>
      )}

      {!isLoading && filteredHolidays.length > 0 && (
        <>
          <section className="mt-6 space-y-4">
            {paginatedHolidays.map((holiday) => (
              <HolidayCard
                key={holiday.id}
                holiday={holiday}
                isDark={isDark}
                onRemove={handleRemoveHoliday}
                isRemoving={removingId === holiday.id}
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
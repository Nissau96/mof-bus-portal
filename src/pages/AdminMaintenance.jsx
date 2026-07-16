import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Archive,
  CalendarDays,
  Database,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import { useTheme } from "../context/useTheme";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";

function StatCard({ label, value, description, icon: Icon, isDark }) {
  return (
    <article
      className={`rounded-3xl p-5 ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            isDark
              ? "bg-white/10 text-emerald-200"
              : "bg-emerald-50 text-mof-primary"
          }`}
        >
          <Icon size={22} />
        </div>

        <div>
          <p
            className={`text-xs font-black uppercase tracking-[0.2em] ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 text-3xl font-black ${
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
    </article>
  );
}

/**
 * Admin Maintenance page.
 *
 * Allows admins to run safe database maintenance tasks manually.
 */
export default function AdminMaintenance() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [archivePreview, setArchivePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadArchivePreview = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await apiFetch("/api/admin/archive-tickets");

      setArchivePreview(data);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load maintenance summary",
        message: error.message || "Failed to load archive preview.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadArchivePreview();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadArchivePreview]);

  async function handleArchiveOldTickets() {
    const confirmed = window.confirm(
      "Archive all old ticket records before today? This will move old daily tickets into booking history and remove old waiting-list records."
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsArchiving(true);

      const data = await apiFetch("/api/admin/archive-tickets", {
        method: "POST",
        body: JSON.stringify({}),
      });

      showToast({
        type: "success",
        title: "Archive completed",
        message:
          data.message ||
          "Old ticket records have been archived successfully.",
      });

      await loadArchivePreview();
    } catch (error) {
      showToast({
        type: "error",
        title: "Archive failed",
        message: error.message || "Failed to archive old ticket records.",
      });
    } finally {
      setIsArchiving(false);
    }
  }

  const oldTicketsCount = archivePreview?.oldTicketsCount ?? "-";
  const oldWaitingCount = archivePreview?.oldWaitingCount ?? "-";
  const today = archivePreview?.today || "-";

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
              System Maintenance
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Run safe maintenance tasks for old ticket records and booking
              history.
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
                  Today
                </p>

                <p className="mt-1 text-lg font-black">{today}</p>
              </div>
            </div>
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
          <p className="text-sm font-bold">Loading maintenance summary...</p>
        </section>
      )}

      {!isLoading && (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Old Tickets"
              value={String(oldTicketsCount)}
              description="Daily ticket records before today"
              icon={Archive}
              isDark={isDark}
            />

            <StatCard
              label="Old Waiting Records"
              value={String(oldWaitingCount)}
              description="Waiting-list records before today"
              icon={Database}
              isDark={isDark}
            />
          </section>

          <section
            className={`mt-6 rounded-3xl p-5 sm:p-6 ${
              isDark
                ? "border border-white/10 bg-slate-900"
                : "border border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2
                  className={`text-xl font-black ${
                    isDark ? "text-white" : "text-slate-950"
                  }`}
                >
                  Archive Old Tickets
                </h2>

                <p
                  className={`mt-2 max-w-2xl text-sm leading-6 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  This will move old daily ticket records into booking history.
                  Today’s active tickets will not be affected. Old waiting-list
                  records will be removed because they can no longer be
                  promoted.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  isArchiving ||
                  Number(archivePreview?.oldTicketsCount || 0) === 0
                }
                onClick={handleArchiveOldTickets}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDark
                    ? "bg-white text-slate-950 hover:bg-emerald-100"
                    : "bg-mof-primary text-white hover:bg-mof-primary-container"
                }`}
              >
                <RefreshCw size={18} />
                {isArchiving ? "Archiving..." : "Archive Old Tickets"}
              </button>
            </div>
          </section>

          <section
            className={`mt-6 rounded-3xl p-5 ${
              isDark
                ? "border border-white/10 bg-slate-900"
                : "border border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className={isDark ? "text-emerald-200" : "text-mof-primary"}
              />

              <p
                className={`text-sm font-semibold leading-6 ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                This action is logged in the audit trail. It is safe to run
                multiple times because archived tickets are matched by their
                original ticket ID.
              </p>
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}
import { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  BadgeCheck,
  BusFront,
  CalendarDays,
  ClipboardList,
  Clock3,
  Database,
  FileSearch,
  Save,
  Settings,
  ShieldCheck,
  TicketCheck,
  UsersRound,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import { useTheme } from "../context/useTheme";
import { apiFetch } from "../lib/api";

function normalizeTimeForInput(timeValue) {
  if (!timeValue) {
    return "";
  }

  return String(timeValue).slice(0, 5);
}

function formatUpdatedAt(dateValue) {
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

function SettingsField({
  label,
  description,
  icon: Icon,
  children,
  isDark,
}) {
  return (
    <div
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

        <div className="w-full">
          <h2
            className={`text-base font-black ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {label}
          </h2>

          <p
            className={`mt-1 text-sm leading-6 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {description}
          </p>

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function AdminToolCard({ title, description, href, buttonLabel, icon: Icon, isDark }) {
  return (
    <section
      className={`rounded-3xl p-5 sm:p-6 ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
            <h2
              className={`text-xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {title}
            </h2>

            <p
              className={`mt-1 text-sm leading-6 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {description}
            </p>
          </div>
        </div>

        <a
          href={href}
          className={`inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-black transition ${
            isDark
              ? "bg-white text-slate-950 hover:bg-emerald-100"
              : "bg-mof-primary text-white hover:bg-mof-primary-container"
          }`}
        >
          {buttonLabel}
        </a>
      </div>
    </section>
  );
}

const adminTools = [
  {
    title: "Ticket Management",
    description: "View today’s confirmed, cancelled, and waiting-list records.",
    href: "/admin/tickets",
    buttonLabel: "View Today’s Tickets",
    icon: TicketCheck,
  },
  
  {
    title: "Privileged Users",
    description:
      "Manage staff who should receive priority consideration during daily bus booking.",
    href: "/admin/privileged-users",
    buttonLabel: "Manage Privileged Users",
    icon: BadgeCheck,
  },
  {
    title: "Booking History",
    description: "View archived ticket records from previous service days.",
    href: "/admin/booking-history",
    buttonLabel: "View Booking History",
    icon: Archive,
  },
  {
    title: "Public Holidays",
    description: "Manage dates where staff bus booking should automatically close.",
    href: "/admin/public-holidays",
    buttonLabel: "Manage Public Holidays",
    icon: CalendarDays,
  },
  {
    title: "Passenger Manifest",
    description: "View and export confirmed passengers for the selected travel date.",
    href: "/admin/manifest",
    buttonLabel: "Open Manifest",
    icon: ClipboardList,
  },
  {
    title: "System Maintenance",
    description:
      "Archive old daily ticket records and clean up old waiting-list records.",
    href: "/admin/maintenance",
    buttonLabel: "Open Maintenance",
    icon: Database,
  },
  
];

/**
 * Admin Settings page.
 *
 * Allows admin users to update bus capacity, booking open time,
 * and the departure window.
 *
 * Also provides an Admin Tools section for secondary admin operations.
 */
export default function AdminSettings() {
  const { isDark } = useTheme();

  const [busCapacity, setBusCapacity] = useState("36");
  const [bookingOpenTime, setBookingOpenTime] = useState("16:20");
  const [departureStartTime, setDepartureStartTime] = useState("16:45");
  const [departureEndTime, setDepartureEndTime] = useState("17:00");
  const [updatedAt, setUpdatedAt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const data = await apiFetch("/api/admin/settings");

        if (!isMounted) {
          return;
        }

        setBusCapacity(String(data.settings.bus_capacity || 36));
        setBookingOpenTime(
          normalizeTimeForInput(data.settings.booking_open_time)
        );
        setDepartureStartTime(
          normalizeTimeForInput(data.settings.departure_start_time)
        );
        setDepartureEndTime(
          normalizeTimeForInput(data.settings.departure_end_time)
        );
        setUpdatedAt(data.settings.updated_at || "");
      } catch (error) {
        alert(error.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSaving(true);

      const data = await apiFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          busCapacity,
          bookingOpenTime,
          departureStartTime,
          departureEndTime,
        }),
      });

      setBusCapacity(String(data.settings.bus_capacity || 36));
      setBookingOpenTime(normalizeTimeForInput(data.settings.booking_open_time));
      setDepartureStartTime(
        normalizeTimeForInput(data.settings.departure_start_time)
      );
      setDepartureEndTime(
        normalizeTimeForInput(data.settings.departure_end_time)
      );
      setUpdatedAt(data.settings.updated_at || "");

      alert(data.message);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass = `min-h-12 w-full rounded-xl border px-4 text-sm font-bold outline-none transition ${
    isDark
      ? "border-white/10 bg-white/5 text-white focus:border-emerald-300"
      : "border-slate-200 bg-slate-50 text-slate-950 focus:border-mof-primary"
  }`;

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
              System Settings
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Configure the daily staff bus capacity, booking open time, departure
              window, and access key administrative tools.
            </p>
          </div>

          <div
            className={`rounded-2xl px-5 py-4 ${
              isDark ? "bg-white/10 text-white" : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings size={22} />
              <div>
                <p className="text-xs font-black uppercase tracking-wide">
                  Last Updated
                </p>
                <p className="mt-1 text-sm font-black">
                  {formatUpdatedAt(updatedAt)}
                </p>
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
          <p className="text-sm font-bold">Loading settings...</p>
        </section>
      )}

      {!isLoading && (
        <>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <SettingsField
              label="Bus Capacity"
              description="Maximum number of confirmed seats available for the daily staff bus."
              icon={BusFront}
              isDark={isDark}
            >
              <input
                type="number"
                min="1"
                max="200"
                value={busCapacity}
                onChange={(event) => setBusCapacity(event.target.value)}
                className={inputClass}
              />
            </SettingsField>

            <SettingsField
              label="Booking Open Time"
              description="The time users are allowed to start booking daily tickets."
              icon={Clock3}
              isDark={isDark}
            >
              <input
                type="time"
                value={bookingOpenTime}
                onChange={(event) => setBookingOpenTime(event.target.value)}
                className={inputClass}
              />
            </SettingsField>

            <div className="grid gap-4 lg:grid-cols-2">
              <SettingsField
                label="Departure Start Time"
                description="The earliest expected departure time for the bus."
                icon={Clock3}
                isDark={isDark}
              >
                <input
                  type="time"
                  value={departureStartTime}
                  onChange={(event) =>
                    setDepartureStartTime(event.target.value)
                  }
                  className={inputClass}
                />
              </SettingsField>

              <SettingsField
                label="Departure End Time"
                description="The latest expected departure time for the bus."
                icon={Clock3}
                isDark={isDark}
              >
                <input
                  type="time"
                  value={departureEndTime}
                  onChange={(event) => setDepartureEndTime(event.target.value)}
                  className={inputClass}
                />
              </SettingsField>
            </div>

            <section
              className={`rounded-3xl p-5 sm:p-6 ${
                isDark
                  ? "border border-white/10 bg-slate-900"
                  : "border border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2
                    className={`text-xl font-black ${
                      isDark ? "text-white" : "text-slate-950"
                    }`}
                  >
                    Save Configuration
                  </h2>
                  <p
                    className={`mt-1 text-sm ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Changes will affect new booking summaries and admin metrics.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDark
                      ? "bg-white text-slate-950 hover:bg-emerald-100"
                      : "bg-mof-primary text-white hover:bg-mof-primary-container"
                  }`}
                >
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </section>

            <section
              className={`rounded-3xl p-5 ${
                isDark
                  ? "border border-white/10 bg-slate-900 text-slate-300"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={20}
                  className={isDark ? "text-emerald-200" : "text-mof-primary"}
                />
                <p className="text-sm font-semibold leading-6">
                  All changes are recorded in the audit log. Keep capacity
                  updates aligned with the actual number of available seats on
                  the assigned bus.
                </p>
              </div>
            </section>
          </form>

          <section
            className={`mt-8 rounded-3xl p-5 sm:p-6 ${
              isDark
                ? "border border-white/10 bg-slate-900"
                : "border border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={`text-xs font-black uppercase tracking-[0.22em] ${
                    isDark ? "text-slate-400" : "text-mof-primary"
                  }`}
                >
                  Admin Tools
                </p>

                <h2
                  className={`mt-2 text-xl font-black ${
                    isDark ? "text-white" : "text-slate-950"
                  }`}
                >
                  Operations Shortcuts
                </h2>
              </div>

              <p
                className={`text-sm font-semibold ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Access secondary admin operations from one place.
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              {adminTools.map((tool) => (
                <AdminToolCard
                  key={tool.href}
                  title={tool.title}
                  description={tool.description}
                  href={tool.href}
                  buttonLabel={tool.buttonLabel}
                  icon={tool.icon}
                  isDark={isDark}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}
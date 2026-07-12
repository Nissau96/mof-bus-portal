import {
  BusFront,
  CalendarDays,
  ClipboardList,
  CloudSun,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import {
  USER_DASHBOARD_METRICS,
  USER_QUICK_ACTIONS,
} from "../constants/dashboardData";
import { useTheme } from "../context/ThemeContext";

/**
 * Dashboard page.
 * 
 * This page now supports light/dark theme switching.
 * Normal users only see simplified dashboard metrics and quick actions.
 */
export default function Dashboard() {
  const userName = "Ibrahim";
  const { isDark, theme, toggleTheme } = useTheme();

  const pageClass = isDark
    ? "bg-slate-950 text-white"
    : "bg-[#f7fbf3] text-slate-950";

  const topNavClass = isDark
    ? "border-white/10 bg-slate-950/90"
    : "border-slate-200 bg-[#f7fbf3]/90";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  return (
    <main className={`min-h-screen transition-colors ${pageClass}`}>
      {/* Top navigation bar */}
      <header className={`sticky top-0 z-20 border-b backdrop-blur ${topNavClass}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <BusFront size={22} />
            </div>

            <div>
              <p className="text-sm font-bold leading-none">
                MoF Bus Portal
              </p>
              <p className={`mt-1 hidden text-xs sm:block ${mutedTextClass}`}>
                Staff transport workspace
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <a
              href="/book"
              className={`hidden rounded-xl px-4 py-2 text-sm font-bold transition sm:inline-flex ${
                isDark
                  ? "bg-white text-slate-950 hover:bg-emerald-100"
                  : "bg-mof-primary text-white hover:bg-mof-primary-container"
              }`}
            >
              Book Ticket
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isDark
                  ? "border-white/10 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:bg-white"
              }`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden ${
                isDark
                  ? "border-white/10 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:bg-white"
              }`}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <button
              type="button"
              className={`hidden h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold lg:inline-flex ${
                isDark
                  ? "border-white/10 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero / welcome area */}
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section
            className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 lg:p-10 ${
              isDark
                ? "border border-white/10 bg-[#3e5048]"
                : "border border-slate-200 bg-white"
            }`}
          >
            {/* Decorative background circles */}
            <div
              className={`pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full border-[22px] ${
                isDark ? "border-white/5" : "border-emerald-100"
              }`}
            />
            <div
              className={`pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[18px] ${
                isDark ? "border-white/5" : "border-emerald-50"
              }`}
            />

            <div className="relative z-10">
              <p
                className={`text-xs font-black uppercase tracking-[0.22em] ${
                  isDark ? "text-white/80" : "text-mof-primary"
                }`}
              >
                Good morning, {userName} • Sunday, July 12
              </p>

              <h1
                className={`mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                Personal Workspace
              </h1>

              <p
                className={`mt-4 max-w-2xl text-sm font-semibold leading-6 sm:text-base ${
                  isDark ? "text-white" : "text-slate-700"
                }`}
              >
                Your staff transport bookings, ticket status, and route tasks in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
                    isDark
                      ? "bg-slate-950/40 text-white"
                      : "bg-emerald-50 text-mof-primary"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isDark ? "bg-white" : "bg-mof-primary"
                    }`}
                  />
                  Staff User
                </span>

                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${
                    isDark
                      ? "border-white/10 bg-white/10 text-white/80"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  Transport Service
                </span>
              </div>
            </div>

            <div
              className={`absolute right-8 top-8 hidden md:block ${
                isDark ? "text-white/60" : "text-mof-primary/30"
              }`}
            >
              <CloudSun size={42} />
            </div>
          </section>

          {/* Side action card */}
          <aside
            className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 ${
              isDark
                ? "border border-white/10 bg-[#838e85]"
                : "border border-slate-200 bg-mof-surface-muted"
            }`}
          >
            <div
              className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${
                isDark ? "bg-white/10" : "bg-white/60"
              }`}
            />

            <div className="relative z-10">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  isDark
                    ? "bg-white/15 text-orange-200"
                    : "bg-white text-mof-primary"
                }`}
              >
                <ClipboardList size={26} />
              </div>

              <h2
                className={`mt-6 text-xl font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                Bus Ticketing
              </h2>

              <p
                className={`mt-3 text-sm font-semibold leading-6 ${
                  isDark ? "text-white" : "text-slate-700"
                }`}
              >
                Book, track, and manage your daily staff bus ticket in one place.
              </p>

              <a
                href="/book"
                className={`mt-10 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-black shadow-lg transition ${
                  isDark
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-mof-primary text-white hover:bg-mof-primary-container"
                }`}
              >
                Book ticket now
              </a>
            </div>
          </aside>
        </div>

        {/* User metrics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {USER_DASHBOARD_METRICS.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              icon={metric.icon}
              tone={metric.tone}
              isDark={isDark}
            />
          ))}
        </section>

        {/* Main lower content */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div
            className={`rounded-3xl p-5 sm:p-6 ${
              isDark
                ? "border border-white/10 bg-slate-900"
                : "border border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Quick Actions
                </h2>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Common user tasks for your transport account.
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                  isDark
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-emerald-50 text-mof-primary"
                }`}
              >
                <ShieldCheck size={15} />
                Secure portal
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {USER_QUICK_ACTIONS.map((action) => (
                <QuickActionCard
                  key={action.label}
                  label={action.label}
                  description={action.description}
                  href={action.href}
                  icon={action.icon}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>

          <aside
            className={`rounded-3xl p-5 sm:p-6 ${
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
                <CalendarDays size={22} />
              </div>

              <div>
                <h2 className="font-black">
                  Today’s Schedule
                </h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Ministry staff bus
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ["Booking Status", "Open"],
                ["Departure Window", "4:45 PM - 5:00 PM"],
                ["Route Ends At", "Adenta"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-2xl p-4 ${
                    isDark ? "bg-white/5" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </p>
                  <p
                    className={`mt-2 text-lg font-black ${
                      isDark ? "text-white" : "text-slate-950"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
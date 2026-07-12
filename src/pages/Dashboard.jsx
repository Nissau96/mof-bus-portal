import {
  BusFront,
  CalendarDays,
  ClipboardList,
  CloudSun,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import {
  DASHBOARD_METRICS,
  QUICK_ACTIONS,
} from "../constants/dashboardData";

/**
 * Dashboard page.
 * This is the main landing page after login.
 * It is designed to work well on mobile, tablet, and desktop screens.
 */
export default function Dashboard() {
  const userName = "Ibrahim";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <BusFront size={22} />
            </div>

            <div>
              <p className="text-sm font-bold leading-none">
                MoF Bus Portal
              </p>
              <p className="mt-1 hidden text-xs text-slate-400 sm:block">
                Staff transport workspace
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <a
              href="/book"
              className="hidden rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-100 sm:inline-flex"
            >
              Book Ticket
            </a>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-300 hover:bg-white/10 lg:inline-flex"
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
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#3e5048] p-6 shadow-sm sm:p-8 lg:p-10">
            {/* Decorative background circles */}
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full border-22 border-white/5" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-18 border-white/5" />

            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">
                Good morning, {userName} • Sunday, July 12
              </p>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Personal Workspace
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white sm:text-base">
                Your staff transport bookings, ticket status, and route tasks in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/40 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  Staff User
                </span>

                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/80">
                  Transport Service
                </span>
              </div>
            </div>

            <div className="absolute right-8 top-8 hidden text-white/60 md:block">
              <CloudSun size={42} />
            </div>
          </section>

          {/* Side action card */}
          <aside className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#838e85] p-6 shadow-sm sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

            <div className="relative z-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-orange-200">
                <ClipboardList size={26} />
              </div>

              <h2 className="mt-6 text-xl font-black text-white">
                Bus Ticketing
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-white">
                Book, track, and manage your daily staff bus ticket in one place.
              </p>

              <a
                href="/book"
                className="mt-10 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800"
              >
                Book ticket now
              </a>
            </div>
          </aside>
        </div>

        {/* Metrics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DASHBOARD_METRICS.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              icon={metric.icon}
              tone={metric.tone}
            />
          ))}
        </section>

        {/* Main lower content */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Quick Actions
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Common transport tasks for today.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
                <ShieldCheck size={15} />
                Secure portal
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionCard
                  key={action.label}
                  label={action.label}
                  description={action.description}
                  href={action.href}
                  icon={action.icon}
                />
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                <CalendarDays size={22} />
              </div>

              <div>
                <h2 className="font-black">
                  Today’s Schedule
                </h2>
                <p className="text-sm text-slate-400">
                  Ministry staff bus
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Booking Status
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  Open
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Departure Window
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  4:45 PM - 5:00 PM
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Route Ends At
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  Adenta
                </p>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
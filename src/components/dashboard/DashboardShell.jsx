import { BusFront, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/useTheme";
import { signOutUser } from "../../lib/auth";

/**
 * DashboardShell provides a shared dashboard layout.
 *
 * It includes:
 * - Top navigation
 * - Theme toggle
 * - Dark/light page background
 * - Responsive content width
 *
 * The dashboard and booking page will both use this shell.
 */
export default function DashboardShell({ children }) {
  const { isDark, theme, toggleTheme } = useTheme();

  const pageClass = isDark
    ? "bg-slate-950 text-white"
    : "bg-[#f7fbf3] text-slate-950";

  const topNavClass = isDark
    ? "border-white/10 bg-slate-950/90"
    : "border-slate-200 bg-[#f7fbf3]/90";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  async function handleLogout() {
    try {
      await signOutUser();
      window.location.href = "/";
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <main className={`min-h-screen transition-colors ${pageClass}`}>
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
            {/* <a
              href="/book"
              className={`hidden rounded-xl px-4 py-2 text-sm font-bold transition sm:inline-flex ${isDark
                  ? "bg-white text-slate-950 hover:bg-emerald-100"
                  : "bg-mof-primary text-white hover:bg-mof-primary-container"
                }`}
            >
              Book Ticket
            </a> */}

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${isDark
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
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden ${isDark
                  ? "border-white/10 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:bg-white"
                }`}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={`hidden h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold lg:inline-flex ${isDark
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
        {children}
      </section>
    </main>
  );
}
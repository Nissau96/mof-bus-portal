import { useEffect, useState } from "react";
import {
  BusFront,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { useTheme } from "../../context/useTheme";
import { signOutUser } from "../../lib/auth";
import { apiFetch } from "../../lib/api";

const userNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Admin Dashboard",
    href: "/admin",
    icon: ShieldCheck,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    label: "System Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileSearch,
  },
];

function getCurrentPath() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.pathname;
}

function NavLink({ item, isDark, onClick }) {
  const Icon = item.icon;
  const currentPath = getCurrentPath();
  const isActive = currentPath === item.href;

  return (
    <a
      href={item.href}
      onClick={onClick}
      className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
        isActive
          ? isDark
            ? "bg-white text-slate-950"
            : "bg-mof-primary text-white"
          : isDark
            ? "text-slate-300 hover:bg-white/10 hover:text-white"
            : "text-slate-600 hover:bg-emerald-50 hover:text-mof-primary"
      }`}
    >
      <Icon size={17} />
      <span>{item.label}</span>
    </a>
  );
}

/**
 * DashboardShell provides a shared dashboard layout.
 *
 * Ordinary users see:
 * - Dashboard
 * - Profile
 *
 * Admin users see:
 * - Dashboard
 * - Admin Dashboard
 * - Profile
 * - System Settings
 * - User Management
 * - Audit Logs
 */
export default function DashboardShell({ children }) {
  const { isDark, theme, toggleTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);

  const isAdmin = currentProfile?.role === "admin";
  const visibleNavItems = isAdmin ? adminNavItems : userNavItems;

  const pageClass = isDark
    ? "bg-slate-950 text-white"
    : "bg-[#f7fbf3] text-slate-950";

  const topNavClass = isDark
    ? "border-white/10 bg-slate-950/90"
    : "border-slate-200 bg-[#f7fbf3]/90";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentProfile() {
      try {
        const data = await apiFetch("/api/profile/me");

        if (!isMounted) {
          return;
        }

        setCurrentProfile(data.profile || null);
      } catch {
        if (isMounted) {
          setCurrentProfile(null);
        }
      }
    }

    loadCurrentProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await signOutUser();
      window.location.href = "/";
    } catch (error) {
      alert(error.message);
    }
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <main className={`min-h-screen transition-colors ${pageClass}`}>
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur ${topNavClass}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <BusFront size={22} />
            </div>

            <div>
              <p className="text-sm font-bold leading-none">MoF Bus Portal</p>
              <p className={`mt-1 hidden text-xs sm:block ${mutedTextClass}`}>
                Staff transport workspace
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
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
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden ${
                isDark
                  ? "border-white/10 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:bg-white"
              }`}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <button
              type="button"
              onClick={handleLogout}
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

        <div
          className={`hidden border-t lg:block ${
            isDark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 overflow-x-auto pb-1">
              {visibleNavItems.map((item) => (
                <NavLink key={item.href} item={item} isDark={isDark} />
              ))}
            </nav>
          </div>
        </div>

        {isMenuOpen && (
          <div
            className={`border-t px-4 py-4 lg:hidden ${
              isDark
                ? "border-white/10 bg-slate-950"
                : "border-slate-200 bg-[#f7fbf3]"
            }`}
          >
            <div className="space-y-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isDark={isDark}
                  onClick={closeMenu}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={`mt-5 flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 text-sm font-bold ${
                isDark
                  ? "border-white/10 text-slate-300 hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </section>
    </main>
  );
}
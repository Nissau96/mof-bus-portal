import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { apiFetch } from "../../lib/api";

const USER_PROFILE_CACHE_KEY = "mof_bus_profile";

function getCachedProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cachedProfile = window.localStorage.getItem(USER_PROFILE_CACHE_KEY);

    if (!cachedProfile) {
      return null;
    }

    return JSON.parse(cachedProfile);
  } catch {
    return null;
  }
}

/**
 * AdminRoute protects admin-only frontend pages.
 *
 * It checks the cached profile first for instant routing,
 * then confirms with /api/profile/me to avoid stale localStorage issues.
 */
export default function AdminRoute({ children }) {
  const cachedProfile = getCachedProfile();

  const [isChecking, setIsChecking] = useState(!cachedProfile);
  const [isAdmin, setIsAdmin] = useState(cachedProfile?.role === "admin");

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminProfile() {
      try {
        const data = await apiFetch("/api/profile/me");
        const profile = data.profile || null;

        window.localStorage.setItem(
          USER_PROFILE_CACHE_KEY,
          JSON.stringify(profile || {})
        );

        if (!isMounted) {
          return;
        }

        setIsAdmin(profile?.role === "admin");
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    verifyAdminProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fbf3] px-4 text-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-mof-primary">
            Checking Access
          </p>
          <h1 className="mt-3 text-2xl font-black text-slate-950">
            Please wait...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
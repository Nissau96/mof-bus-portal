import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";

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
 * PublicRoute protects public-only pages.
 *
 * If a user is already logged in, they should not remain on login/register.
 * Admin users go to /admin.
 * Ordinary users go to /dashboard.
 */
export default function PublicRoute({ children }) {
  const cachedProfile = getCachedProfile();

  const [isChecking, setIsChecking] = useState(true);
  const [redirectPath, setRedirectPath] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (!session) {
          setRedirectPath("");
          return;
        }

        const nextPath = cachedProfile?.role === "admin" ? "/admin" : "/dashboard";
        setRedirectPath(nextPath);
      } catch {
        if (isMounted) {
          setRedirectPath("");
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [cachedProfile?.role]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fbf3] px-4 text-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-mof-primary">
            Checking Session
          </p>
          <h1 className="mt-3 text-2xl font-black text-slate-950">
            Please wait...
          </h1>
        </div>
      </div>
    );
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
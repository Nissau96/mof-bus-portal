import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import { getCachedProfile } from "../../lib/profileCache";
import LoadingScreen from "../common/LoadingScreen";


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
    <LoadingScreen
      eyebrow="Checking Session"
      title="Please wait..."
      description="Checking whether you are already signed in."
    />
  );
}

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
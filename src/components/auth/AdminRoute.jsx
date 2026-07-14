import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { apiFetch } from "../../lib/api";
import { getCachedProfile, setCachedProfile } from "../../lib/profileCache";

import LoadingScreen from "../common/LoadingScreen";


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

        setCachedProfile(profile);

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
    <LoadingScreen
      eyebrow="Checking Access"
      title="Please wait..."
      description="Confirming your administrator permissions."
    />
  );
}

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
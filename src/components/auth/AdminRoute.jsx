import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import LoadingScreen from "../common/LoadingScreen";
import { apiFetch } from "../../lib/api";
import {
  clearCachedProfile,
  getCachedProfile,
  setCachedProfile,
} from "../../lib/profileCache";

/**
 * AdminRoute protects admin-only frontend pages.
 *
 * It checks the cached profile first for instant routing,
 * then confirms with /api/profile/me to avoid stale localStorage issues.
 */
export default function AdminRoute({ children }) {
  const cachedProfile = getCachedProfile();
  const cachedIsAdmin = cachedProfile?.role === "admin";

  const [isChecking, setIsChecking] = useState(!cachedIsAdmin);
  const [isAdmin, setIsAdmin] = useState(cachedIsAdmin);

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
        clearCachedProfile();

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
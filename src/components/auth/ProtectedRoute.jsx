import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import { clearCachedProfile } from "../../lib/profileCache";
import LoadingScreen from "../common/LoadingScreen";


/**
 * ProtectedRoute blocks unauthenticated users from private pages.
 *
 * It checks the Supabase session before rendering dashboard/admin pages.
 */
export default function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

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

        setHasSession(Boolean(session));
      } catch {
        if (isMounted) {
          setHasSession(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearCachedProfile();
      }

      setHasSession(Boolean(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isChecking) {
  return (
    <LoadingScreen
      eyebrow="Checking Session"
      title="Please wait..."
      description="Verifying your secure portal session."
    />
  );
}

  if (!hasSession) {
    return <Navigate to="/" replace />;
  }

  return children;
}
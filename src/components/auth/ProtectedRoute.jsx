import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import { clearCachedProfile } from "../../lib/profileCache";



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

  if (!hasSession) {
    return <Navigate to="/" replace />;
  }

  return children;
}
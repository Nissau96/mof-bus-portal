import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/**
 * ProtectedRoute blocks unauthenticated users from accessing private pages.
 *
 * If the user is not logged in, they are redirected back to the login page.
 */
export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      setStatus("authenticated");
    }

    checkSession();
  }, []);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mof-bg px-4">
        <div className="rounded-2xl border border-mof-border bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-mof-text">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  return children;
}
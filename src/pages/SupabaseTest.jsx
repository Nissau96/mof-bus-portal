import { useEffect, useState } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../context/useTheme";

/**
 * SupabaseTest confirms that the React app can reach Supabase.
 *
 * This is a temporary developer page.
 * We can remove it after authentication and booking are working.
 */
export default function SupabaseTest() {
  const { isDark } = useTheme();
  const [status, setStatus] = useState("Checking connection...");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function testConnection() {
      // This reads system_settings through the RLS policy for authenticated users.
      // Since we are not logged in yet, this may return an RLS error.
      // That is expected until auth is connected.
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .maybeSingle();

      if (error) {
        setStatus(`Connected to Supabase, but read blocked by policy: ${error.message}`);
        return;
      }

      setSettings(data);
      setStatus("Connected to Supabase successfully.");
    }

    testConnection();
  }, []);

  return (
    <DashboardShell>
      <div
        className={`rounded-3xl p-6 ${
          isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
        }`}
      >
        <h1
          className={`text-2xl font-black ${
            isDark ? "text-white" : "text-slate-950"
          }`}
        >
          Supabase Connection Test
        </h1>

        <p
          className={`mt-4 text-sm leading-6 ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {status}
        </p>

        {settings && (
          <pre
            className={`mt-5 overflow-auto rounded-2xl p-4 text-xs ${
              isDark ? "bg-white/5 text-slate-200" : "bg-slate-50 text-slate-700"
            }`}
          >
            {JSON.stringify(settings, null, 2)}
          </pre>
        )}
      </div>
    </DashboardShell>
  );
}
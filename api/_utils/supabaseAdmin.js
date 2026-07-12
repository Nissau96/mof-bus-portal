import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase admin client.
 *
 * This uses the service role key and must only be used inside backend API files.
 * Never import this file inside src/ frontend files.
 */
export function getSupabaseAdmin() {
  const env = globalThis.process?.env;
  const supabaseUrl = env?.SUPABASE_URL;
  const serviceRoleKey = env?.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
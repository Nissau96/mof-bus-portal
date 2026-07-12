import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase anon client.
 *
 * This is used when the API needs to perform normal user authentication,
 * such as signing in with email and password.
 */
export function getSupabaseAnon() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase anon server environment variables.");
  }

  return createClient(supabaseUrl, anonKey);
}
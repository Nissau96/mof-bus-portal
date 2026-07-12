import { createClient } from "@supabase/supabase-js";

/**
 * Supabase browser client.
 *
 * This client uses only frontend-safe environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 *
 * Never use the service role key in frontend code.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
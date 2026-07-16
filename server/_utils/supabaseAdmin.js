import process from "node:process";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase admin client.
 *
 * This uses the service role key and must only be used inside backend API files.
 * Never import this file inside src/ frontend files.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
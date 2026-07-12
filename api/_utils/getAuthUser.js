import process from "node:process";
import { createClient } from "@supabase/supabase-js";

/**
 * getAuthUser reads the Bearer token from the request header
 * and verifies it with Supabase Auth.
 *
 * This allows backend API functions to know which logged-in user
 * is making the request.
 */
export async function getAuthUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase auth environment variables.");
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}
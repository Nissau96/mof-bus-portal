import { supabase } from "./supabaseClient";

/**
 * saveSupabaseSession stores a session returned by a backend API.
 *
 * We use this after Staff ID login because the backend signs the user in
 * and returns a valid Supabase session.
 */
export async function saveSupabaseSession(session) {
  if (!session?.access_token || !session?.refresh_token) {
    throw new Error("Invalid login session received.");
  }

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    throw error;
  }
}

/**
 * signOutUser signs the current user out of Supabase Auth.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
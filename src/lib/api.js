import { supabase } from "./supabaseClient";

/**
 * apiFetch is a small wrapper around fetch.
 *
 * It helps us:
 * - Send JSON requests
 * - Attach the Supabase access token when available
 * - Read JSON responses
 * - Throw clear errors when the backend returns an error
 */
export async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
import { supabase } from "./supabaseClient";
import { clearCachedProfile } from "./profileCache";



async function handleUnauthorizedSession() {
  clearCachedProfile();

  await supabase.auth.signOut();

  window.location.href = "/";
}

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

  if (response.status === 401) {
    await handleUnauthorizedSession();

    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
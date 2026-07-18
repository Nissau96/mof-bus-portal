import { supabase } from "./supabaseClient";
import { clearCachedProfile } from "./profileCache";

function isAuthEndpoint(path) {
  return String(path || "").startsWith("/api/auth/");
}

async function handleUnauthorizedSession() {
  clearCachedProfile();

  await supabase.auth.signOut();

  window.location.href = "/";
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => "");

  return {
    message: text || response.statusText || "Request failed.",
  };
}

export async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    ...(options.headers || {}),
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await readResponseBody(response);

  if (response.status === 401 && !isAuthEndpoint(path)) {
    await handleUnauthorizedSession();

    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}. Please try again.`
    );
  }

  return data;
}
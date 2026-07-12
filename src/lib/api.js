/**
 * apiFetch is a small wrapper around fetch.
 *
 * It helps us:
 * - Send JSON requests
 * - Read JSON responses
 * - Throw clear errors when the backend returns an error
 */
export async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
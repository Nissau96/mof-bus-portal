const USER_PROFILE_CACHE_KEY = "mof_bus_profile";

export function getCachedProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cachedProfile = window.localStorage.getItem(USER_PROFILE_CACHE_KEY);

    if (!cachedProfile) {
      return null;
    }

    return JSON.parse(cachedProfile);
  } catch {
    return null;
  }
}

export function setCachedProfile(profile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    USER_PROFILE_CACHE_KEY,
    JSON.stringify(profile || {})
  );
}

export function clearCachedProfile() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(USER_PROFILE_CACHE_KEY);
}
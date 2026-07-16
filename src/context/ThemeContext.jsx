import { useCallback, useEffect, useMemo, useState } from "react";

import { ThemeContext } from "./themeContext";

const THEME_STORAGE_KEY = "mof-bus-theme";

function getDeviceTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * getInitialTheme safely reads the saved theme from localStorage.
 *
 * If the user has not manually selected a theme before, it uses the
 * current device/system appearance setting.
 */
function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return getDeviceTheme();
}

/**
 * ThemeProvider wraps the application and manages light/dark mode.
 *
 * Default behavior:
 * - Uses saved user preference when available.
 * - Otherwise follows the current device/system theme.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleDeviceThemeChange(event) {
      setTheme(event.matches ? "dark" : "light");
    }

    mediaQuery.addEventListener("change", handleDeviceThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleDeviceThemeChange);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
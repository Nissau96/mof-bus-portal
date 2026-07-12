import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";

/**
 * getInitialTheme safely reads the saved theme from localStorage.
 *
 * It runs only once when the ThemeProvider first loads.
 * This avoids calling setTheme inside useEffect.
 */
function getInitialTheme() {
  const savedTheme = localStorage.getItem("mof-bus-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "dark";
}

/**
 * ThemeProvider wraps the application and manages light/dark mode.
 *
 * This file exports only a React component, which keeps React Fast Refresh happy.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Store the selected theme for future visits.
    localStorage.setItem("mof-bus-theme", theme);

    // Add the theme as a data attribute on the document.
    // This can be used later for theme-specific CSS if needed.
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
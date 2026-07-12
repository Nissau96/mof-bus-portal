import { useContext } from "react";
import { ThemeContext } from "./themeContext";

/**
 * useTheme gives components access to the active theme and toggle function.
 *
 * This hook lives outside ThemeContext.jsx so the provider file can export
 * only a component.
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
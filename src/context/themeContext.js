import { createContext } from "react";

/**
 * Shared theme context object.
 *
 * This file exports only the context, not a React component.
 * Keeping it separate prevents React Fast Refresh warnings.
 */
export const ThemeContext = createContext(null);
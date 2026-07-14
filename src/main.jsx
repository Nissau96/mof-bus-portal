import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
import { useCallback, useMemo, useState } from "react";

import ToastContainer from "../components/common/ToastContainer";
import { ToastContext } from "./toastContextValue";

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((toastId) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    );
  }, []);

  const showToast = useCallback(
    ({ title, message = "", type = "info", duration = 4000 }) => {
      const safeTitle = title || "Notification";

      const toast = {
        id: createToastId(),
        title: safeTitle,
        message,
        type,
      };

      setToasts((currentToasts) => [toast, ...currentToasts].slice(0, 4));

      if (duration > 0 && typeof window !== "undefined") {
        window.setTimeout(() => {
          removeToast(toast.id);
        }, duration);
      }
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
    }),
    [showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
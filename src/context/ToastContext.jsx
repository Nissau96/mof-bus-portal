import { createContext, useCallback, useMemo, useState } from "react";
import ToastContainer from "../components/common/ToastContainer";

export const ToastContext = createContext(null);

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
      const toast = {
        id: createToastId(),
        title,
        message,
        type,
      };

      setToasts((currentToasts) => [toast, ...currentToasts].slice(0, 4));

      if (duration > 0) {
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
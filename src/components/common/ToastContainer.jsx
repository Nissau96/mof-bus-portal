import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

function getToastStyles(type) {
  if (type === "success") {
    return {
      icon: CheckCircle2,
      wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
      iconClass: "text-emerald-600",
      role: "status",
      ariaLive: "polite",
    };
  }

  if (type === "error") {
    return {
      icon: XCircle,
      wrapper: "border-red-200 bg-red-50 text-red-900",
      iconClass: "text-red-600",
      role: "alert",
      ariaLive: "assertive",
    };
  }

  if (type === "warning") {
    return {
      icon: AlertTriangle,
      wrapper: "border-amber-200 bg-amber-50 text-amber-900",
      iconClass: "text-amber-600",
      role: "alert",
      ariaLive: "assertive",
    };
  }

  return {
    icon: Info,
    wrapper: "border-slate-200 bg-white text-slate-900",
    iconClass: "text-mof-primary",
    role: "status",
    ariaLive: "polite",
  };
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        const Icon = styles.icon;

        return (
          <div
            key={toast.id}
            role={styles.role}
            aria-live={styles.ariaLive}
            className={`rounded-2xl border p-4 shadow-lg backdrop-blur ${styles.wrapper}`}
          >
            <div className="flex items-start gap-3">
              <Icon
                size={22}
                aria-hidden="true"
                className={`mt-0.5 shrink-0 ${styles.iconClass}`}
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{toast.title}</p>

                {toast.message && (
                  <p className="mt-1 text-sm font-semibold leading-5 opacity-80">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemove(toast.id)}
                className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
                aria-label="Close notification"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
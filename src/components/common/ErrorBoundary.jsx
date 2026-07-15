import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error);
    console.error("Error details:", errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fbf3] px-4 py-10 text-slate-950">
        <section
          role="alert"
          aria-live="assertive"
          className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={30} aria-hidden="true" />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-red-600">
            Application Error
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Something went wrong
          </h1>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            The page failed to render correctly. You can reload the page or go
            back to the dashboard.
          </p>

          {this.state.errorMessage && (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left text-sm font-semibold text-slate-700">
              {this.state.errorMessage}
            </div>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-mof-primary px-5 text-sm font-black text-white transition hover:bg-mof-primary-container"
            >
              <RefreshCcw size={18} aria-hidden="true" />
              Reload Page
            </button>

            <Link
              to="/dashboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Home size={18} aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }
}
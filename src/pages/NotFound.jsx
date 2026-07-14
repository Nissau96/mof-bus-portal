import { Link } from "react-router-dom";
import { ArrowLeft, Home, SearchX } from "lucide-react";

import { useTheme } from "../context/useTheme";

export default function NotFound() {
  const { isDark } = useTheme();

  return (
    <main
      className={`flex min-h-screen items-center justify-center px-4 py-10 ${
        isDark ? "bg-slate-950 text-white" : "bg-[#f7fbf3] text-slate-950"
      }`}
    >
      <section
        className={`w-full max-w-xl rounded-3xl p-6 text-center shadow-sm sm:p-8 ${
          isDark
            ? "border border-white/10 bg-slate-900"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            isDark
              ? "bg-white/10 text-emerald-200"
              : "bg-emerald-50 text-mof-primary"
          }`}
        >
          <SearchX size={30} />
        </div>

        <p
          className={`mt-6 text-xs font-black uppercase tracking-[0.22em] ${
            isDark ? "text-slate-400" : "text-mof-primary"
          }`}
        >
          Page Not Found
        </p>

        <h1
          className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${
            isDark ? "text-white" : "text-slate-950"
          }`}
        >
          This page does not exist
        </h1>

        <p
          className={`mt-3 text-sm font-semibold leading-6 ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          The link may be incorrect, moved, or unavailable. Please return to the
          dashboard or login page.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            to="/dashboard"
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition ${
              isDark
                ? "bg-white text-slate-950 hover:bg-emerald-100"
                : "bg-mof-primary text-white hover:bg-mof-primary-container"
            }`}
          >
            <Home size={18} />
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-black transition ${
              isDark
                ? "border-white/10 text-slate-300 hover:bg-white/10"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
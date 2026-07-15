import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * QuickActionCard displays a clickable dashboard action.
 *
 * It supports both dark and light modes and remains fully responsive.
 */
export default function QuickActionCard({
  label,
  description,
  href,
  icon: Icon,
  isDark,
}) {
  return (
    <Link
      to={href}
      className={`group block rounded-2xl p-5 transition ${
        isDark
          ? "border border-white/10 bg-slate-800/70 hover:border-white/20 hover:bg-slate-800"
          : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isDark
              ? "bg-white/10 text-emerald-200"
              : "bg-emerald-50 text-mof-primary"
          }`}
        >
          <Icon size={22} />
        </div>

        <ArrowRight
          size={18}
          className={`mt-1 transition group-hover:translate-x-1 ${
            isDark
              ? "text-slate-500 group-hover:text-white"
              : "text-slate-400 group-hover:text-mof-primary"
          }`}
        />
      </div>

      <h3
        className={`mt-5 text-base font-bold ${
          isDark ? "text-white" : "text-slate-950"
        }`}
      >
        {label}
      </h3>

      <p
        className={`mt-2 text-sm leading-6 ${
          isDark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {description}
      </p>
    </Link>
  );
}
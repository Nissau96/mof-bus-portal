import { ArrowRight } from "lucide-react";

/**
 * QuickActionCard displays a clickable dashboard action.
 * It uses a normal anchor link for now.
 * Later, we can replace it with React Router's Link component.
 */
export default function QuickActionCard({ label, description, href, icon: Icon }) {
  return (
    <a
      href={href}
      className="group block rounded-2xl border border-white/10 bg-slate-800/70 p-5 transition hover:border-white/20 hover:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
          <Icon size={22} />
        </div>

        <ArrowRight
          size={18}
          className="mt-1 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white"
        />
      </div>

      <h3 className="mt-5 text-base font-bold text-white">
        {label}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </a>
  );
}
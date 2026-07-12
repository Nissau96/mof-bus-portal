/**
 * MetricCard displays a single dashboard statistic.
 * It is reusable so that dashboard cards remain consistent.
 */
export default function MetricCard({ label, value, description, icon: Icon, tone }) {
  const toneClasses = {
    blue: "bg-blue-600 text-white",
    green: "bg-mof-primary text-white",
    amber: "bg-amber-500 text-white",
    red: "bg-rose-500 text-white",
  };

  return (
    <article className="rounded-2xl border border-white/5 bg-slate-800/90 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            toneClasses[tone] || toneClasses.green
          }`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-300">
            {label}
          </p>

          <p className="mt-5 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
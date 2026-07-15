/**
 * MetricCard displays a single dashboard statistic.
 *
 * The card supports both dark and light dashboard themes.
 */
export default function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "green",
  isDark,
}) {
  const toneClasses = {
    blue: "bg-blue-600 text-white",
    green: "bg-mof-primary text-white",
    amber: "bg-amber-500 text-white",
    red: "bg-rose-500 text-white",
  };

  const selectedToneClass = toneClasses[tone] || toneClasses.green;

  return (
    <article
      className={`rounded-2xl p-5 shadow-sm transition ${
        isDark
          ? "border border-white/5 bg-slate-800/90"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${selectedToneClass}`}
        >
          {Icon ? <Icon size={22} aria-hidden="true" /> : null}
        </div>

        <div className="min-w-0">
          <p
            className={`text-sm font-semibold ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-5 text-3xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {value}
          </p>

          <p
            className={`mt-1 text-xs leading-5 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
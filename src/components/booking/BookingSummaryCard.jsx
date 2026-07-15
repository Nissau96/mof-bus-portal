/**
 * BookingSummaryCard displays a single booking-related status item.
 *
 * Examples:
 * - Available seats
 * - Booking status
 * - Departure time
 * - Travel date
 */
export default function BookingSummaryCard({
  label,
  value,
  description,
  icon: Icon,
  isDark,
}) {
  return (
    <article
      className={`rounded-2xl p-5 transition ${
        isDark
          ? "border border-white/10 bg-slate-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          isDark
            ? "bg-white/10 text-emerald-200"
            : "bg-emerald-50 text-mof-primary"
        }`}
      >
        {Icon ? <Icon size={21} aria-hidden="true" /> : null}
      </div>

      <p
        className={`mt-5 text-sm font-semibold ${
          isDark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-black ${
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
    </article>
  );
}
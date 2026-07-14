import { LoaderCircle } from "lucide-react";

export default function LoadingScreen({
  eyebrow = "Loading",
  title = "Please wait...",
  description = "",
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbf3] px-4 py-10 text-center text-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-mof-primary">
          <LoaderCircle size={28} className="animate-spin" />
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-mof-primary">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h1>

        {description && (
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        )}
      </section>
    </main>
  );
}
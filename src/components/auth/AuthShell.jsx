import { BusFront } from "lucide-react";

/**
 * AuthShell provides the shared layout for login and registration pages.
 * It keeps the background, logo area, title, subtitle, and centered card consistent.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}) {
  return (
    <main className="min-h-screen bg-mof-bg px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl items-center justify-center">
        <div className={wide ? "w-full max-w-xl" : "w-full max-w-md"}>
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-mof-border bg-mof-surface-muted text-mof-primary shadow-sm">
              <BusFront size={30} />
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-mof-text sm:text-4xl">
              {title}
            </h1>

            <p className="mt-2 text-sm leading-6 text-mof-text-muted sm:text-base">
              {subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-mof-border bg-mof-surface shadow-sm">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
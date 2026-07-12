/**
 * AuthTabs switches between Staff and Intern/NSP forms.
 * It is used on both the login page and the registration page.
 */
export default function AuthTabs({ activeTab, onChange }) {
  return (
    <div className="grid grid-cols-2 rounded-t-2xl border-b border-mof-border bg-mof-surface-muted">
      <button
        type="button"
        onClick={() => onChange("staff")}
        className={`min-h-12 rounded-tl-2xl px-4 text-sm font-semibold transition ${
          activeTab === "staff"
            ? "border-b-2 border-mof-primary bg-mof-surface text-mof-primary"
            : "text-mof-text-muted hover:bg-mof-surface-high"
        }`}
      >
        Staff
      </button>

      <button
        type="button"
        onClick={() => onChange("intern")}
        className={`min-h-12 rounded-tr-2xl px-4 text-sm font-semibold transition ${
          activeTab === "intern"
            ? "border-b-2 border-mof-primary bg-mof-surface text-mof-primary"
            : "text-mof-text-muted hover:bg-mof-surface-high"
        }`}
      >
        Intern / NSP
      </button>
    </div>
  );
}
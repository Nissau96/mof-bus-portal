/**
 * FormInput is a small reusable input component.
 * Labels are always visible above the field for accessibility and clarity.
 */
export default function FormInput({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = true,
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-mof-text">{label}</span>

      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-12 w-full rounded-xl border border-mof-border bg-white px-4 text-sm text-mof-text outline-none transition placeholder:text-slate-400 focus:border-mof-primary focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}
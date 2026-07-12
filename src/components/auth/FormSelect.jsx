import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * FormSelect is a reusable shadcn/ui select component.
 *
 * It is used for:
 * - Division
 * - Bus Route
 * - Preferred Drop-off Location
 *
 * This keeps all select fields visually consistent across the app.
 */
export default function FormSelect({
  label,
  id,
  value,
  onChange,
  placeholder,
  groupLabel,
  options,
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="text-sm font-medium text-mof-text">
        {label}
      </label>

      <Select
        value={value}
        onValueChange={(selectedValue) => onChange(selectedValue)}
      >
        <SelectTrigger
          id={id}
          className="mt-1 min-h-12 w-full rounded-xl border border-mof-border bg-white px-4 text-sm text-mof-text shadow-none outline-none focus:border-mof-primary focus:ring-4 focus:ring-green-900/10"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent className="rounded-xl border border-mof-border bg-white">
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold uppercase tracking-wide text-mof-text-muted">
              {groupLabel}
            </SelectLabel>

            {options.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="cursor-pointer rounded-lg text-sm"
              >
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
import { BUS_ROUTES } from "../../constants/busRoutes";

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
 * RouteSelect is the preferred drop-off location selector.
 * 
 * This version uses shadcn/ui Select instead of the native HTML select.
 * It gives the form a cleaner, more professional dropdown design.
 */
export default function RouteSelect({ value, onChange }) {
  return (
    <div className="block">
      <label
        htmlFor="dropoffLocation"
        className="text-sm font-medium text-mof-text"
      >
        Preferred Drop-off Location
      </label>

      <Select
        value={value}
        onValueChange={(selectedValue) => onChange(selectedValue)}
      >
        <SelectTrigger
          id="dropoffLocation"
          className="mt-1 min-h-12 w-full rounded-xl border border-mof-border bg-white px-4 text-sm text-mof-text shadow-none outline-none focus:border-mof-primary focus:ring-4 focus:ring-green-900/10"
        >
          <SelectValue placeholder="Select an area" />
        </SelectTrigger>

        <SelectContent className="rounded-xl border border-mof-border bg-white">
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold uppercase tracking-wide text-mof-text-muted">
              Bus Route
            </SelectLabel>

            {BUS_ROUTES.map((route) => (
              <SelectItem
                key={route}
                value={route}
                className="cursor-pointer rounded-lg text-sm"
              >
                {route}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
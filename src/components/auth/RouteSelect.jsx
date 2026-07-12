import { BUS_ROUTES } from "../../constants/busRoutes";
import FormSelect from "./FormSelect";

/**
 * RouteSelect is the preferred drop-off location selector.
 *
 * It now uses the shared FormSelect component so all dropdowns
 * have the same shadcn/ui design.
 */
export default function RouteSelect({ value, onChange }) {
  return (
    <FormSelect
      id="dropoffLocation"
      label="Preferred Drop-off Location"
      value={value}
      onChange={onChange}
      placeholder="Select an area"
      groupLabel="Drop-off Locations"
      options={BUS_ROUTES}
    />
  );
}
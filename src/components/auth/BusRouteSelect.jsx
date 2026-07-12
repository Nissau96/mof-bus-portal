import { BUS_ROUTE_OPTIONS } from "../../constants/busRoutesList";
import FormSelect from "./FormSelect";

/**
 * BusRouteSelect allows users to select the main bus route they use.
 */
export default function BusRouteSelect({ value, onChange }) {
  return (
    <FormSelect
      id="busRoute"
      label="Bus Route"
      value={value}
      onChange={onChange}
      placeholder="Select your bus route"
      groupLabel="Bus Routes"
      options={BUS_ROUTE_OPTIONS}
    />
  );
}
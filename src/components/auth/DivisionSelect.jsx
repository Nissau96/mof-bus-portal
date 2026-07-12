import { DIVISIONS } from "../../constants/divisions";
import FormSelect from "./FormSelect";

/**
 * DivisionSelect allows users to select their Ministry division.
 */
export default function DivisionSelect({ value, onChange }) {
  return (
    <FormSelect
      id="division"
      label="Division"
      value={value}
      onChange={onChange}
      placeholder="Select your division"
      groupLabel="Ministry Divisions"
      options={DIVISIONS}
    />
  );
}
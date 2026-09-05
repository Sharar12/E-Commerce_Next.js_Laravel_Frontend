import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type YearPickerProps = {
  value?: number;
  onChange: (year: number) => void;
  startYear?: number;
  endYear?: number;
  placeholder?: string;
};

export function YearPicker({
  value,
  onChange,
  startYear = 1980,
  endYear = new Date().getFullYear(),
  placeholder = "Select year",
}: YearPickerProps) {
  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => endYear - i
  );

  return (
    <Select
      value={String(value ?? currentYear)}
      onValueChange={(val) => onChange(Number(val))}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

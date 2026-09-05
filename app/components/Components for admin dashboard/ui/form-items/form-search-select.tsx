import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, XIcon } from "lucide-react";
import { cn } from "@/utils";
import { useState } from "react";
import { Loading } from "../../common/loading";

// Define the types for your props
interface FormSearchSelectProps<T> {
  name: string;
  title?: string;
  data: T[];
  loading?: boolean;
  className?: string;
  width?: string;
  valueField: keyof T;
  displayField: keyof T;
  additionalDisplayField?: keyof T; // NEW
  form: any;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const FormSearchSelect = <T extends Record<string, any>>({
  form,
  name,
  title,
  data,
  loading,
  className,
  valueField,
  displayField,
  additionalDisplayField, // NEW
  placeholder = "Select an option",
  disabled = false,
  required = false,
}: FormSearchSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Build display text based on available fields
  const getDisplayText = (item: T) => {
    const main = String(item[displayField] ?? "");
    const extra = additionalDisplayField
      ? String(item[additionalDisplayField] ?? "")
      : "";
    return extra ? `${main} ${extra}` : main;
  };

  // Filter data based on display and additional field
  const filteredData = data.filter((item) => {
    const display = getDisplayText(item).toLowerCase();
    return display.includes(searchQuery.toLowerCase());
  });

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedItem = data.find(
          (item) =>
            item[valueField] === field.value ||
            String(item[valueField]) === String(field.value)
        );

        return (
          <FormItem className="w-full">
            <FormLabel>
              {title} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                  >
                    <span className="max-w-[30ch] overflow-hidden text-ellipsis">
                      {selectedItem
                        ? getDisplayText(selectedItem)
                        : placeholder}
                    </span>
                    {field.value ? (
                      <XIcon
                        className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          field.onChange(undefined);
                        }}
                      />
                    ) : (
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className={cn("p-0 w-full", className)}>
                <Command>
                  <CommandInput
                    placeholder="Search..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {loading ? (
                        <Loading />
                      ) : (
                        filteredData.map((item, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => {
                              field.onChange(item[valueField]);
                              setOpen(false);
                            }}
                            disabled={disabled}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === item[valueField] ||
                                  String(field.value) ===
                                    String(item[valueField])
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {getDisplayText(item)}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default FormSearchSelect;

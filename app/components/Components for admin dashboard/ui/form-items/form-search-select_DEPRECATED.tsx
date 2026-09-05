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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/utils";
import { useState } from "react";
import { Loading } from "../../common/loading";

interface FormSearchSelect_DEPRECATEDProps<T> {
  name: string;
  title?: string;
  data: T[];
  loading?: boolean;
  className?: string;
  valueField: keyof T;
  displayField: keyof T;
  form: any;
  placeholder?: string;
  disabled?: any;
  required?: boolean;
  additionalDisplayField?: keyof T;
}

const FormSearchSelect_DEPRECATED = <T extends Record<string, any>>({
  form,
  name,
  title,
  data,
  loading,
  className,
  valueField,
  displayField,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  additionalDisplayField,
}: FormSearchSelect_DEPRECATEDProps<T>) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter the data based on the search query
  const filteredData = data.filter((item) => {
    const displayText = String(item[displayField]);
    const additionalText = additionalDisplayField
      ? String(item[additionalDisplayField])
      : "";
    return (
      displayText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      additionalText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedItem = data.find(
          (singleData) => String(singleData[valueField]) === field.value
        );

        return (
          <FormItem className={cn("w-full")}>
            <FormLabel>
              {title}{" "}
              {title && required && (
                <span>
                  <span className="text-red-500">*</span>
                </span>
              )}
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
                    <span className="flex-1 truncate text-left">
                      {selectedItem ? (
                        <>
                          {String(selectedItem[displayField])}
                          {additionalDisplayField && selectedItem[additionalDisplayField] && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({String(selectedItem[additionalDisplayField])})
                            </span>
                          )}
                        </>
                      ) : (
                        placeholder
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                              field.onChange(String(item[valueField]));
                              setOpen(false);
                            }}
                            disabled={disabled}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === String(item[valueField])
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {String(item[displayField])}
                            {additionalDisplayField && item[additionalDisplayField] && (
                              <span className="text-gray-500 ml-1">
                                {`  (${String(item[additionalDisplayField])})`}
                              </span>
                            )}
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

export default FormSearchSelect_DEPRECATED;

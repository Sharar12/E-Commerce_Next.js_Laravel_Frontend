"use client";

import { type Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options";
import DataTableBulkActions, {
  type BulkAction,
  type BulkActionItem,
} from "./data-table-bulk-actions";
// import { Button } from "../button";
// import { File, Sheet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/store/hooks/useDebounce";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  bulkActions?: BulkActionItem[];
  onBulkSelectChange?: (value: BulkAction<TData>) => void;
  setStartDate?: (value: Date | null) => void;
  setEndDate?: (value: Date | null) => void;
  datePicker?: boolean;
  onChangeSearch?: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  bulkActions,
  onBulkSelectChange = () => {},
  onChangeSearch,
}: DataTableToolbarProps<TData>) {
  const flag = useRef(false);
  const [inputValue, setInputValue] = useState<string>("");
  const debouncedValue = useDebounce(inputValue, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    flag.current = true;
  };

  // Getting search result
  useEffect(() => {
    if (flag.current && onChangeSearch) {
      flag.current = false; // preventing the infinite loop
      onChangeSearch(debouncedValue);
    }
  }, [debouncedValue, onChangeSearch]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search..."
          value={
            onChangeSearch
              ? inputValue
              : (table.getState().globalFilter as string) ?? ""
          }
          onChange={(event) =>
            onChangeSearch
              ? handleInputChange(event)
              : table.setGlobalFilter(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {bulkActions && (
          <DataTableBulkActions
            table={table}
            actions={bulkActions}
            onBulkSelectChange={onBulkSelectChange}
          />
        )}
      </div>
      <div className="flex space-x-2 items-center">
        {/* <Button variant="outline" size="sm" className="h-8 lg:flex">
          CSV <Sheet className="ml-1" size={16} strokeWidth={1.2} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 lg:flex">
          PDF <File className="ml-1" size={16} strokeWidth={1.2} />
        </Button> */}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

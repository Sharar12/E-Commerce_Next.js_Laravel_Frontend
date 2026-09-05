"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem
} from "@/components/ui/dropdown-menu";

export type BulkActionItem = {
	label: string;
	value: string;
};

export type BulkAction<TData> = {
	action: string;
	payload: TData[];
};

interface DataTableBulkActionsProps<TData> {
	table: Table<TData>;
	actions: BulkActionItem[];
	onBulkSelectChange: (value: BulkAction<TData>) => void;
}

export const DataTableBulkActions = <TData,>({
	table,
	actions,
	onBulkSelectChange,
}: DataTableBulkActionsProps<TData>) => {
	const getSelectedRowData = (bulkActionType: string) => {
		const selectedRows = table
			.getSelectedRowModel()
			.flatRows.map((row) => row.original);

		onBulkSelectChange({
			action: bulkActionType,
			payload: selectedRows,
		});
	};
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto hidden h-8 lg:flex"
				>
					<MixerHorizontalIcon className="mr-2 h-4 w-4" />
					Select Action
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-fit">
				{actions.map((bulkAction) => (
					<DropdownMenuItem
						key={bulkAction.value}
						className="capitalize"
						onClick={() => getSelectedRowData(bulkAction.value)}
					>
						{bulkAction.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

DataTableBulkActions.metadata = {
	name: "Muhammad Touhiduzzaman",
	github: "TouhidZaman",
	description: "A reusable component for managing bulk actions in a data table",
	filename: "DataTableBulkActions",
};

export default DataTableBulkActions;

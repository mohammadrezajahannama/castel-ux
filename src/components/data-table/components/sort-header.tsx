import { Column, RowData } from "@tanstack/react-table";
import { DataTableFeatures } from "@/components/data-table/types";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableSortHeaderProps<TData extends RowData, TValue> {
  column: Column<DataTableFeatures, TData, TValue>;
  children: React.ReactNode;
}

/** Value for the header cell's `aria-sort`; undefined when the column can't be sorted. */
export const getAriaSort = <TData extends RowData, TValue>(column: Column<DataTableFeatures, TData, TValue>) => {
  if (!column.getCanSort()) return undefined;
  const sort = column.getIsSorted();
  return sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none";
};

/**
 * A sortable column's header as one button: its name, then the direction. The sorted column reads in full colour; the
 * others keep a faint up-down mark, full on hover, so they stay findable on a phone with no hover.
 */
export const DataTableSortHeader = <TData extends RowData, TValue>({
  column,
  children,
}: DataTableSortHeaderProps<TData, TValue>) => {
  if (!column.getCanSort()) return children;

  const sort = column.getIsSorted();
  const SortIcon = sort === "desc" ? ArrowDownIcon : sort === "asc" ? ArrowUpIcon : ChevronsUpDownIcon;

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "group -mx-1 inline-flex items-center gap-1 rounded-sm px-1 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        sort && "text-foreground",
      )}
    >
      {children}
      <SortIcon className={cn("size-3.5 shrink-0", !sort && "opacity-40 group-hover:opacity-100")} />
    </button>
  );
};

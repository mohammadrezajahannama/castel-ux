import { m } from "@/paraglide/messages.js";
import { CellTooltip } from "@/components/data-table/components/cell-tooltip";
import { DataTableSortHeader, getAriaSort } from "@/components/data-table/components/sort-header";
import { useTableContext } from "@/components/data-table/table-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

interface TableViewProps {
  isLoading: boolean;
  rowHeight: number;
  /** In place of the rows when there are none: why, and what to do about it (e.g. an error and "Try again"). */
  empty?: React.ReactNode;
}

export function TableView({ isLoading, rowHeight, empty = m.table_no_results() }: TableViewProps) {
  const { table } = useTableContext();
  return (
    <div className="overflow-hidden rounded-md border">
      {/* Tabular figures throughout, so numbers in a column line up digit under digit wherever they sit. */}
      <Table className="tabular-nums">
        {/* A faint band and muted names, so the header reads as labels for the rows rather than one more of them. */}
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  aria-sort={getAriaSort(header.column)}
                  className={cn("text-muted-foreground", header.column.columnDef.meta?.align === "end" && "text-end")}
                  style={{ minWidth: header.getSize(), width: header.getSize() }}
                >
                  {header.isPlaceholder ? null : (
                    <DataTableSortHeader column={header.column}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </DataTableSortHeader>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: table.state.pagination.pageSize }).map((_, index) => (
              <TableRow key={index} style={{ height: rowHeight }}>
                {table.getVisibleLeafColumns().map((column) => (
                  <TableCell key={column.id}>
                    {/* A block, so the column's `text-end` can't move it: an end column pushes it over. */}
                    <Skeleton className={cn("h-4 w-1/2", column.columnDef.meta?.align === "end" && "ms-auto")} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} style={{ height: rowHeight }}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn(cell.column.columnDef.meta?.align === "end" && "text-end")}>
                    <CellTooltip cell={cell}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</CellTooltip>
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-32 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">{empty}</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

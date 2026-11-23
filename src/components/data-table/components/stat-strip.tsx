import { Dash } from "@/components/data-table/components/cells";
import { TableAdditional, TableStat } from "@/components/data-table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

interface StatStripProps {
  stats: TableStat[];
  values?: TableAdditional;
  /** No response yet: each number pulses in its place. */
  loading: boolean;
}

/**
 * The table's totals, a tile each, label over number. The stats are declared, so each holds its place from the first
 * paint (a pulse until the response, "—" if it never says). A tile is at least 10rem and grows to its number, never cut
 * short; a row that runs out of room wraps.
 */
export function StatStrip({ stats, values, loading }: StatStripProps) {
  return (
    <dl className="mb-3 flex flex-wrap gap-2">
      {stats.map(({ key, label }) => {
        const value = values?.[key];
        return (
          <div key={key} className="min-w-40 rounded-lg bg-card px-3 py-2 whitespace-nowrap ring-1 ring-foreground/10">
            <dt className="text-xs font-medium text-muted-foreground">{label()}</dt>
            <dd className="text-base leading-6 font-semibold tabular-nums">
              {loading ? <Skeleton className="my-1 h-4 w-16" /> : value == null ? <Dash /> : formatNumber(value, 2)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

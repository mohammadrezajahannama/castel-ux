import { m } from "@/paraglide/messages.js";
import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableFeatures, SimpleDataTable } from "@/components/data-table";
import { formatNumber } from "@/lib/utils";
import { summarize } from "@/features/results/services";
import type { RunRow } from "@/features/results/types";

const SCENARIOS = [
  ["a", m.scenario_a],
  ["b", m.scenario_b],
  ["c", m.scenario_c],
] as const;

type Line = { scenario: string } & ReturnType<typeof summarize>;

const num = (key: keyof ReturnType<typeof summarize>, label: () => string, decimals = 0) =>
  ({
    accessorKey: key,
    header: label(),
    cell: ({ row }) => formatNumber(row.original[key], decimals),
    size: 130,
    meta: { align: "end" },
  }) satisfies ColumnDef<DataTableFeatures, Line>;

/** The same measures for each scenario side by side: the A/B/C comparison the test is for. */
export function ScenarioCompare({ rows, loading }: { rows: RunRow[]; loading: boolean }) {
  const data = useMemo<Line[]>(
    () =>
      SCENARIOS.map(([key, label]) => ({
        scenario: label(),
        ...summarize(rows.filter((row) => row.scenario === key)),
      })),
    [rows],
  );

  const columns = useMemo<ColumnDef<DataTableFeatures, Line>[]>(
    () => [
      { accessorKey: "scenario", header: m.compare_scenario(), size: 180 },
      num("runs", m.compare_runs),
      num("success", m.results_stat_success, 1),
      num("wrongSuccess", m.results_stat_wrong, 1),
      num("cancelled", m.outcome_cancelled, 1),
      num("comprehension", m.results_stat_comprehension, 1),
      num("confidentWrong", m.results_stat_confident_wrong, 1),
      num("difficulty", m.results_difficulty, 1),
      num("medianTime", m.results_stat_time),
    ],
    [],
  );

  return (
    <SimpleDataTable
      title={m.results_compare_title()}
      columns={columns}
      data={data}
      isLoading={loading}
      rowHeight={45}
    />
  );
}

import { m } from "@/paraglide/messages.js";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, FileUp, Monitor, RefreshCw, Smartphone } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import {
  DataTable,
  DataTableFeatures,
  DataTableQueryParams,
  Dash,
  DateCell,
  FilterDef,
  TableStat,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { TypeBadge } from "@/components/type-badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogButton } from "@/components/dialog-button";
import { formatNumber } from "@/lib/utils";
import { filterRows, loadRuns, pageOf, runsQueryKey, useRuns } from "@/features/results/services";
import { downloadCsv } from "@/features/results/csv";
import { ImportForm } from "@/features/results/components/import-form";
import { ScenarioCompare } from "@/features/results/components/scenario-compare";
import type { RunRow } from "@/features/results/types";

export const SCENARIO_LABEL: Record<RunRow["scenario"], () => string> = {
  a: m.scenario_a,
  b: m.scenario_b,
  c: m.scenario_c,
};
export const DEVICE_ICONS = { mobile: Smartphone, desktop: Monitor };
const DEVICE_LABEL: Record<RunRow["device"], () => string> = { mobile: m.device_mobile, desktop: m.device_desktop };

const resultOf = (row: RunRow) => (row.success ? "success" : row.wrongSuccess ? "wrong" : "none");
const seconds = (ms: number) => `${formatNumber(Math.round(ms / 1000))} ${m.seconds_short()}`;

const filters: FilterDef[] = [
  { name: "q", label: m.results_search, type: "text", pinned: true },
  {
    name: "scenario",
    label: m.results_scenario,
    type: "multiselect",
    options: () => (["a", "b", "c"] as const).map((value) => ({ value, label: SCENARIO_LABEL[value]() })),
  },
  {
    name: "result",
    label: m.results_result,
    type: "multiselect",
    options: () => [
      { value: "success", label: m.results_success() },
      { value: "wrong", label: m.results_wrong() },
      { value: "none", label: m.results_none() },
    ],
  },
  {
    name: "outcome",
    label: m.results_outcome,
    type: "multiselect",
    options: () => [
      { value: "completed", label: m.outcome_completed() },
      { value: "cancelled", label: m.outcome_cancelled() },
      { value: "abandoned", label: m.outcome_abandoned() },
    ],
  },
  {
    name: "device",
    label: m.results_device,
    type: "multiselect",
    options: () => [
      { value: "mobile", label: m.device_mobile(), icon: Smartphone },
      { value: "desktop", label: m.device_desktop(), icon: Monitor },
    ],
  },
  { name: "received", label: m.results_received, type: "dateRange" },
];

const stats: TableStat[] = [
  { key: "runs", label: m.results_stat_runs },
  { key: "success", label: m.results_stat_success },
  { key: "wrongSuccess", label: m.results_stat_wrong },
  { key: "comprehension", label: m.results_stat_comprehension },
  { key: "confidentWrong", label: m.results_stat_confident_wrong },
  { key: "medianTime", label: m.results_stat_time },
];

const score = (value: number | null, of: number) =>
  value === null ? <Dash /> : `${formatNumber(value)} / ${formatNumber(of)}`;

export const ResultsTable = () => {
  const queryClient = useQueryClient();
  const runs = useRuns();
  const search = useSearch({ from: "/_main/" });

  // Every run is loaded once (the query above); the table pages, sorts and filters them here.
  const queryFn = useMemo(
    () => async (params: DataTableQueryParams) =>
      pageOf(
        (await queryClient.fetchQuery({ queryKey: runsQueryKey, queryFn: loadRuns, staleTime: 60_000 })).rows,
        params,
      ),
    [queryClient],
  );

  const columns = useMemo<ColumnDef<DataTableFeatures, RunRow>[]>(
    () => [
      {
        accessorKey: "receivedAt",
        header: m.results_received(),
        enableSorting: true,
        cell: ({ row }) => <DateCell value={row.original.receivedAt} />,
        size: 120,
      },
      {
        accessorKey: "scenario",
        header: m.results_scenario(),
        cell: ({ row }) => SCENARIO_LABEL[row.original.scenario]?.() ?? row.original.scenario,
        size: 170,
      },
      {
        id: "result",
        header: m.results_result(),
        cell: ({ row }) => <StatusBadge status={resultOf(row.original)} />,
        size: 130,
      },
      {
        accessorKey: "outcome",
        header: m.results_outcome(),
        cell: ({ row }) => <StatusBadge status={row.original.outcome} />,
        size: 110,
      },
      {
        accessorKey: "comprehension",
        header: m.results_comprehension(),
        enableSorting: true,
        cell: ({ row }) => score(row.original.comprehension, 4),
        size: 110,
        meta: { align: "end" },
      },
      {
        accessorKey: "confidence",
        header: m.results_confidence(),
        enableSorting: true,
        cell: ({ row }) => score(row.original.confidence, 5),
        size: 90,
        meta: { align: "end" },
      },
      {
        accessorKey: "difficulty",
        header: m.results_difficulty(),
        enableSorting: true,
        cell: ({ row }) => score(row.original.difficulty, 5),
        size: 90,
        meta: { align: "end" },
      },
      {
        accessorKey: "taskTime",
        header: m.results_time(),
        enableSorting: true,
        cell: ({ row }) => seconds(row.original.taskTime),
        size: 100,
        meta: { align: "end" },
      },
      {
        accessorKey: "friction",
        header: m.results_friction(),
        enableSorting: true,
        cell: ({ row }) => formatNumber(row.original.friction),
        size: 90,
        meta: { align: "end" },
      },
      {
        accessorKey: "device",
        header: m.results_device(),
        cell: ({ row }) => (
          <TypeBadge type={row.original.device} icons={DEVICE_ICONS} label={DEVICE_LABEL[row.original.device]?.()} />
        ),
        size: 110,
      },
      {
        accessorKey: "comment",
        header: m.results_comment(),
        cell: ({ row }) => (row.original.comment ? <span className="truncate">{row.original.comment}</span> : <Dash />),
        size: 220,
        meta: { tooltip: (context) => context.row.original.comment || undefined },
      },
      {
        accessorKey: "source",
        header: m.results_source(),
        cell: ({ row }) => (row.original.source === "auto" ? m.results_source_auto() : m.results_source_file()),
        size: 80,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {runs.data && runs.data.unreadable > 0 && (
        <Alert>
          <AlertDescription>{m.results_unreadable({ count: String(runs.data.unreadable) })}</AlertDescription>
        </Alert>
      )}
      {runs.error && (
        <Alert variant="destructive">
          <AlertDescription>{runs.error.message}</AlertDescription>
        </Alert>
      )}

      <DataTable
        queryKey="runs"
        queryFn={queryFn}
        columns={columns}
        filters={filters}
        stats={stats}
        title={m.results_title()}
        actions={[
          <Button
            key="refresh"
            size="sm"
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: runsQueryKey })}
          >
            <RefreshCw />
            {m.results_refresh()}
          </Button>,
          <Button
            key="csv"
            size="sm"
            variant="outline"
            disabled={!runs.data?.rows.length}
            // The rows the filters keep, every page.
            onClick={() => runs.data && downloadCsv(filterRows(runs.data.rows, search.filters))}
          >
            <Download />
            {m.results_csv()}
          </Button>,
          <DialogButton
            key="import"
            size="sm"
            icon={FileUp}
            title={m.results_import()}
            content={(close) => <ImportForm onClose={close} />}
          />,
        ]}
        initialSort={{ id: "receivedAt", desc: true }}
        rowHeight={53}
      />

      <ScenarioCompare rows={runs.data?.rows ?? []} loading={runs.isPending} />
    </div>
  );
};

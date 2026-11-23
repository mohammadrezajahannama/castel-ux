import { m } from "@/paraglide/messages.js";
import { createFileRoute } from "@tanstack/react-router";
import { dataTableSearchSchema } from "@/components/data-table";
import { ResultsTable } from "@/features/results/components/results-table";

export const Route = createFileRoute("/_main/")({
  validateSearch: dataTableSearchSchema,
  staticData: { title: m.results_title },
  head: () => ({ meta: [{ title: `${m.results_title()} · ${m.app_name()}` }] }),
  component: ResultsTable,
});

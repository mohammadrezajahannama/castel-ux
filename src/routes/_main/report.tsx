import { m } from "@/paraglide/messages.js";
import { createFileRoute } from "@tanstack/react-router";
import { ReportFrame } from "@/features/results/components/report-frame";

export const Route = createFileRoute("/_main/report")({
  staticData: { title: m.report_title },
  head: () => ({ meta: [{ title: `${m.report_title()} · ${m.app_name()}` }] }),
  component: ReportFrame,
});

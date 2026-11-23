import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { m } from "@/paraglide/messages.js";
import { loadRuns, runsQueryKey } from "@/features/results/services";
import type { AccountLinkRun } from "@/features/results/types";

declare global {
  interface Window {
    /** What the test page's report (in the frame below) reads its runs from. Same origin, so it can call it. */
    UX_ADMIN?: { getRuns: () => Promise<AccountLinkRun[]>; refresh: () => Promise<void> };
  }
}

/**
 * The account-link test's own detailed report (summary and winner, questions, funnel and time, heatmaps, answers),
 * drawn by the test page in `#report` mode. The panel decrypts the runs and hands them over.
 */
export function ReportFrame() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const runs = () => queryClient.fetchQuery({ queryKey: runsQueryKey, queryFn: loadRuns, staleTime: 60_000 });
    window.UX_ADMIN = {
      getRuns: async () => (await runs()).rows.map((row) => row.run),
      refresh: () => queryClient.invalidateQueries({ queryKey: runsQueryKey }),
    };
    return () => {
      delete window.UX_ADMIN;
    };
  }, [queryClient]);

  return (
    <iframe
      title={m.report_title()}
      src={`${import.meta.env.BASE_URL}../t/account-link/#report`}
      className="h-[calc(100svh-7rem)] w-full rounded-lg border bg-black"
    />
  );
}

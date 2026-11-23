import { useQuery, useQueryClient } from "@tanstack/react-query";
import { m } from "@/paraglide/messages.js";
import { toast } from "sonner";
import { storage } from "@/lib/storage";
import type { DataTableQueryParams, FilterValue, TableQueryFnResponse } from "@/components/data-table";
import { parseRange } from "@/components/data-table";
import { decodeResultCode } from "@/features/results/codec";
import { decryptPayload } from "@/features/results/crypto";
import type { AccountLinkRun, RunRow, RunSource } from "@/features/results/types";

/** The private repo the test pages post results to, as issues (site/shared/config.js). */
export const RESULTS_REPO = "mohammadrezajahannama/castel-ux-results";

// The token test pages post with. It reads issues too, and the site already holds it, so the panel reuses it rather
// than asking for another: what it reads is encrypted for this browser's private key.
let token: Promise<string> | null = null;
const getToken = () =>
  (token ??= fetch(`${import.meta.env.BASE_URL}../shared/submit-token.js`, { cache: "no-store" })
    .then((r) => (r.ok ? r.text() : ""))
    .then((text) => {
      const enc = /UX_SUBMIT_TOKEN = "([^"]*)"/.exec(text)?.[1] ?? "";
      return enc ? [...atob(enc)].reverse().join("") : "";
    })
    .catch(() => ""));

interface Issue {
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  pull_request?: unknown;
}

async function listResultIssues(): Promise<Issue[]> {
  const auth = await getToken();
  if (!auth) throw new Error(m.results_no_token());
  const issues: Issue[] = [];
  for (let page = 1; page <= 50; page++) {
    const response = await fetch(
      `https://api.github.com/repos/${RESULTS_REPO}/issues?state=all&per_page=100&page=${page}&sort=created&direction=desc`,
      { headers: { Authorization: `Bearer ${auth}`, Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) throw new Error(m.results_github_error({ status: String(response.status) }));
    const batch = (await response.json()) as Issue[];
    issues.push(...batch.filter((issue) => !issue.pull_request && issue.title.startsWith("ux:")));
    if (batch.length < 100) break;
  }
  return issues;
}

// Results added by hand from a file or a code (when a tester's page could not send), kept in this browser.
const IMPORTED_KEY = "ux-imported";
const readImported = (): { code: string; at: string }[] => {
  try {
    return JSON.parse(storage.get(IMPORTED_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const isRun = (value: unknown): value is AccountLinkRun =>
  !!value && typeof value === "object" && "id" in value && "scenario" in value && "outcome" in value;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function toRow(run: AccountLinkRun, receivedAt: string, source: RunSource): RunRow {
  const confirmed = run.outcome === "completed";
  const comprehension = run.score?.comp ?? null;
  const confidence = run.answers?.q5 ?? null;
  const taskTime = sum(
    Object.entries(run.times ?? {})
      .filter(([screen]) => screen !== "end" && screen !== "questions")
      .map(([, ms]) => ms),
  );
  return {
    runId: run.id,
    receivedAt,
    source,
    scenario: run.scenario,
    device: run.device,
    assigned: run.assigned,
    outcome: run.outcome,
    success: confirmed && run.choice === "tg",
    wrongSuccess: confirmed && run.choice === "bale",
    comprehension,
    confidence,
    difficulty: run.answers?.q6 ?? null,
    confidentWrong: confidence !== null && comprehension !== null && confidence >= 4 && comprehension <= 2,
    taskTime,
    friction: (run.backs ?? 0) + (run.restarts ?? 0) + (run.cancels ?? 0) + (run.disabledTaps ?? 0),
    comment: run.answers?.q7 ?? "",
    run,
  };
}

/** Every run: the issues GitHub holds, opened with this browser's key, and the ones added by hand. One per run id. */
export async function loadRuns(): Promise<{ rows: RunRow[]; unreadable: number }> {
  const byId = new Map<string, RunRow>();
  let unreadable = 0;

  for (const issue of await listResultIssues()) {
    const payload = /CASTELENC1:[A-Za-z0-9_-]+/.exec(issue.body ?? "")?.[0];
    try {
      if (!payload) throw new Error("empty");
      const run = await decodeResultCode(await decryptPayload(payload));
      if (!isRun(run)) throw new Error("not a run");
      if (!byId.has(run.id)) byId.set(run.id, toRow(run, issue.created_at, "auto"));
    } catch {
      unreadable++;
    }
  }
  for (const { code, at } of readImported()) {
    try {
      const run = await decodeResultCode(code);
      if (isRun(run) && !byId.has(run.id)) byId.set(run.id, toRow(run, at, "file"));
    } catch {
      unreadable++;
    }
  }
  const rows = [...byId.values()].sort((a, b) => b.run.startedAt - a.run.startedAt);
  return { rows, unreadable };
}

export const runsQueryKey = ["runs"];

export const useRuns = () =>
  useQuery({ queryKey: runsQueryKey, queryFn: loadRuns, staleTime: 60_000, refetchInterval: 120_000 });

/** Adds result codes (pasted, or read from tester files). Returns how many were new and how many were not codes. */
export function useImportCodes() {
  const queryClient = useQueryClient();
  return async (texts: string[]) => {
    const found = texts.flatMap((text) => text.match(/CASTEL1[RZ]:[A-Za-z0-9_-]+/g) ?? []);
    const known = new Set(readImported().map((item) => item.code));
    const added: { code: string; at: string }[] = [];
    let bad = 0;
    for (const code of found) {
      if (known.has(code)) continue;
      try {
        if (!isRun(await decodeResultCode(code))) throw new Error("not a run");
        added.push({ code, at: new Date().toISOString() });
        known.add(code);
      } catch {
        bad++;
      }
    }
    storage.set(IMPORTED_KEY, JSON.stringify([...readImported(), ...added]));
    await queryClient.invalidateQueries({ queryKey: runsQueryKey });
    if (added.length) toast.success(m.results_import_done({ count: String(added.length) }));
    else toast.error(found.length ? m.results_import_nothing_new() : m.results_import_no_code());
    return { added: added.length, bad };
  };
}

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
const mean = (values: number[]) => (values.length ? Math.round((sum(values) / values.length) * 10) / 10 : 0);

const asList = (value: FilterValue | undefined) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

/** The rows the table's filters keep. */
export function filterRows(rows: RunRow[], filters: DataTableQueryParams["filters"] = {}) {
  const scenarios = asList(filters.scenario);
  const devices = asList(filters.device);
  const outcomes = asList(filters.outcome);
  const result = asList(filters.result);
  const received = typeof filters.received === "string" ? parseRange(filters.received) : null;
  const q = typeof filters.q === "string" ? filters.q.trim().toLowerCase() : "";

  return rows.filter((row) => {
    if (scenarios.length && !scenarios.includes(row.scenario)) return false;
    if (devices.length && !devices.includes(row.device)) return false;
    if (outcomes.length && !outcomes.includes(row.outcome)) return false;
    if (result.length) {
      const kind = row.success ? "success" : row.wrongSuccess ? "wrong" : "none";
      if (!result.includes(kind)) return false;
    }
    if (received) {
      const at = new Date(row.receivedAt).getTime();
      if (received[0] && at < new Date(received[0]).getTime()) return false;
      if (received[1] && at > new Date(received[1]).getTime()) return false;
    }
    if (q && !row.comment.toLowerCase().includes(q) && !row.runId.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** The numbers over a set of runs, as percentages and means. */
export function summarize(rows: RunRow[]) {
  const answered = rows.filter((row) => row.comprehension !== null);
  return {
    runs: rows.length,
    success: pct(rows.filter((row) => row.success).length, rows.length),
    wrongSuccess: pct(rows.filter((row) => row.wrongSuccess).length, rows.length),
    cancelled: pct(rows.filter((row) => row.outcome === "cancelled").length, rows.length),
    comprehension: mean(answered.map((row) => row.comprehension!)),
    confidentWrong: pct(answered.filter((row) => row.confidentWrong).length, answered.length),
    difficulty: mean(answered.map((row) => row.difficulty!).filter((v) => v !== null)),
    medianTime: (() => {
      const times = rows.map((row) => row.taskTime).sort((a, b) => a - b);
      return times.length ? Math.round(times[Math.floor(times.length / 2)] / 1000) : 0;
    })(),
  };
}

const sortValue: Record<string, (row: RunRow) => number> = {
  receivedAt: (row) => new Date(row.receivedAt).getTime(),
  comprehension: (row) => row.comprehension ?? -1,
  confidence: (row) => row.confidence ?? -1,
  difficulty: (row) => row.difficulty ?? -1,
  taskTime: (row) => row.taskTime,
  friction: (row) => row.friction,
};

/** The DataTable's page of runs, sorted and filtered here (every run is loaded at once). */
export function pageOf(
  rows: RunRow[],
  { page, sort, filters }: DataTableQueryParams,
): Awaited<TableQueryFnResponse<RunRow>> {
  const kept = filterRows(rows, filters);
  const field = sort?.replace(/^-/, "") ?? "receivedAt";
  const value = sortValue[field] ?? sortValue.receivedAt;
  const desc = sort ? sort.startsWith("-") : true;
  const sorted = [...kept].sort((a, b) => (value(a) - value(b)) * (desc ? -1 : 1));
  const stats = summarize(kept);
  return {
    items: sorted.slice((page.index - 1) * page.size, page.index * page.size),
    total: kept.length,
    additional: {
      runs: stats.runs,
      success: stats.success,
      wrongSuccess: stats.wrongSuccess,
      comprehension: stats.comprehension,
      confidentWrong: stats.confidentWrong,
      medianTime: stats.medianTime,
    },
  };
}

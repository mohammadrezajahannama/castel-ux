import type { RunRow } from "@/features/results/types";

const cell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  // Quote every field; a leading = + - @ is escaped so a spreadsheet doesn't run it as a formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

const COLUMNS: [string, (row: RunRow) => unknown][] = [
  ["run_id", (r) => r.runId],
  ["received_at", (r) => r.receivedAt],
  ["source", (r) => r.source],
  ["scenario", (r) => r.scenario],
  ["assigned", (r) => r.assigned],
  ["device", (r) => r.device],
  ["viewport_width", (r) => r.run.vw],
  ["outcome", (r) => r.outcome],
  ["end_screen", (r) => r.run.endScreen],
  ["choice", (r) => r.run.choice],
  ["task_success", (r) => r.success],
  ["wrong_confirm", (r) => r.wrongSuccess],
  ["task_time_s", (r) => Math.round(r.taskTime / 100) / 10],
  ["cancels", (r) => r.run.cancels],
  ["backs", (r) => r.run.backs],
  ["restarts", (r) => r.run.restarts],
  ["disabled_taps", (r) => r.run.disabledTaps],
  ["hold_attempts", (r) => r.run.holdAttempts],
  ["screens_reached", (r) => (r.run.reached ?? []).join(" > ")],
  ["q1", (r) => r.run.answers?.q1],
  ["q1_ok", (r) => r.run.score?.q1],
  ["q2", (r) => r.run.answers?.q2],
  ["q2_ok", (r) => r.run.score?.q2],
  ["q3", (r) => r.run.answers?.q3],
  ["q3_ok", (r) => r.run.score?.q3],
  ["q4", (r) => r.run.answers?.q4],
  ["q4_ok", (r) => r.run.score?.q4],
  ["comprehension_of_4", (r) => r.comprehension],
  ["confidence_q5", (r) => r.confidence],
  ["difficulty_q6", (r) => r.difficulty],
  ["confident_but_wrong", (r) => r.confidentWrong],
  ["comment_q7", (r) => r.comment],
];

/** Downloads the runs as a CSV file (UTF-8 with a BOM, so Excel reads the Persian text). */
export function downloadCsv(rows: RunRow[]) {
  const lines = [
    COLUMNS.map(([name]) => cell(name)).join(","),
    ...rows.map((row) => COLUMNS.map(([, get]) => cell(get(row))).join(",")),
  ];
  const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `castel-ux-account-link-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

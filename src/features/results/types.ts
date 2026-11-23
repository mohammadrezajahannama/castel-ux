/** One run of the account-link test, as its page records it (site/t/account-link, record()). */
export interface AccountLinkRun {
  v: number;
  test?: string;
  id: string;
  scenario: "a" | "b" | "c";
  assigned: "random" | "balanced" | "link";
  device: "mobile" | "desktop";
  vw: number;
  startedAt: number;
  updatedAt: number;
  outcome: "completed" | "cancelled" | "abandoned";
  endScreen: string | null;
  finished: boolean;
  /** The account kept: "tg" (Tomas, the stronger castle: the right one) or "bale". */
  choice: "tg" | "bale" | null;
  choiceCorrect: boolean | null;
  cancels: number;
  backs: number;
  restarts: number;
  holdAttempts: number;
  disabledTaps: number;
  reached: string[];
  /** Milliseconds on each screen. */
  times: Record<string, number>;
  clicks: { s: string; x: number; y: number; a: string; t: number; sel: string }[];
  moves: Record<string, Record<string, number>>;
  answers: { q1: string; q2: string; q3: string; q4: string; q5: number; q6: number; q7: string } | null;
  score: { q1: boolean; q2: boolean; q3: boolean; q4: boolean; comp: number } | null;
}

/** Where a run came from. */
export type RunSource = "auto" | "file";

/** A run with the measures the panel shows, worked out once. */
export interface RunRow {
  runId: string;
  receivedAt: string;
  source: RunSource;
  scenario: AccountLinkRun["scenario"];
  device: AccountLinkRun["device"];
  assigned: AccountLinkRun["assigned"];
  outcome: AccountLinkRun["outcome"];
  /** Kept the stronger castle and confirmed. */
  success: boolean;
  /** Confirmed, but kept the weaker castle: an irreversible mistake. */
  wrongSuccess: boolean;
  comprehension: number | null;
  confidence: number | null;
  difficulty: number | null;
  /** High confidence (4–5) with half or less of the comprehension questions right. */
  confidentWrong: boolean;
  /** Milliseconds from start to the task's end screen. */
  taskTime: number;
  friction: number;
  comment: string;
  run: AccountLinkRun;
}

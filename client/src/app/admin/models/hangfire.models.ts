// ─── Hangfire Job Status ────────────────────────────────────────────────────────

export type HangfireJobStatus = 'Success' | 'Failed' | 'Running' | 'Pending';

// ─── Hangfire Job ──────────────────────────────────────────────────────────────

export interface HangfireJob {
  jobKey: string;
  jobName: string;
  description?: string;
  isEnabled: boolean;
  runTime?: string;           // HH:mm format
  cronExpression?: string;
  timeZone?: string;
  lastRunAt?: string;         // ISO date string
  lastRunStatus?: HangfireJobStatus;
  nextRunAt?: string;         // ISO date string
  lastError?: string | null;
}

// ─── Hangfire Schedule Update Request ─────────────────────────────────────────

export interface UpdateHangfireScheduleRequest {
  isEnabled: boolean;
  runTime: string;            // HH:mm format
  cronExpression: string;     // e.g. "30 23 * * *"
  timeZone: string;           // e.g. "Asia/Ho_Chi_Minh"
}

// ─── Hangfire Summary ─────────────────────────────────────────────────────────

export interface HangfireSummary {
  total: number;
  active: number;
  inactive: number;
  recentlyFailed: number;
}

/** Client-safe sync run types (no SQLite / server imports). */

export type SyncRunKind = "pull" | "import";
export type SyncRunStatus = "queued" | "running" | "success" | "failed";
export type SyncLogLevel = "info" | "warn" | "error";

export interface SyncRunRecord {
	id: string;
	kind: SyncRunKind;
	status: SyncRunStatus;
	phase: string | null;
	progressCurrent: number;
	progressTotal: number;
	startedAt: string;
	finishedAt: string | null;
	error: string | null;
	summary: string | null;
}

export interface SyncLogLine {
	id: number;
	runId: string;
	level: SyncLogLevel;
	message: string;
	createdAt: string;
}

export interface SyncStatusPayload {
	state: {
		lastSuccessAt: string | null;
		lastAttemptAt: string | null;
		lastError: string | null;
		openIssueCount: number;
		bugIssueCount: number;
	};
	activeRun: SyncRunRecord | null;
	recentRuns: SyncRunRecord[];
	logs: SyncLogLine[];
	syncMode: "webhook" | "unconfigured" | "disabled";
}

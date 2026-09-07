import "@tanstack/react-start/server-only";

/**
 * Minimal in-process observability shim.
 *
 * Replaces `@beskid/server-observability` (pino + prom-client), which is not
 * part of the `beskid_sites` workspace. The platform-spec app used it only
 * from `observability-middleware.ts` to record HTTP request durations; there
 * is no `/metrics` endpoint consumer in this app. This shim keeps the same
 * `initObservability` / `getObservability().recordHttpRequest` shape with an
 * in-memory histogram, so the middleware is unchanged and no external
 * dependency is pulled in. See MIGRATION-NOTES.md.
 */

interface HttpRequestRecord {
	method: string;
	path: string;
	status: number;
	durationSeconds: number;
}

interface Observability {
	recordHttpRequest(
		method: string,
		path: string,
		status: number,
		durationSeconds: number,
	): void;
	readonly records: readonly HttpRequestRecord[];
	readonly service: string;
}

let current: Observability | null = null;

function makeObservability(service: string): Observability {
	const records: HttpRequestRecord[] = [];
	return {
		service,
		recordHttpRequest(method, path, status, durationSeconds) {
			records.push({ method, path, status, durationSeconds });
			// Bound the buffer so long-running processes do not leak memory.
			if (records.length > 1024) records.shift();
		},
		get records() {
			return records;
		},
	};
}

export function initObservability(opts: { service: string }): void {
	current = makeObservability(opts.service);
}

export function getObservability(): Observability {
	if (!current) {
		initObservability({ service: "beskid-platform-spec" });
	}
	return current ?? makeObservability("beskid-platform-spec");
}

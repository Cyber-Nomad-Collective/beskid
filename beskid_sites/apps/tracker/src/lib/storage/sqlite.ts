/**
 * SQLite facade over Node's built-in `node:sqlite` (DatabaseSync).
 * Drop-in replacement for `bun:sqlite` — compatible API shape.
 */
import { DatabaseSync } from "node:sqlite";

export type Database = {
	exec(sql: string): void;
	run(
		sql: string,
		...bindings: unknown[]
	): { changes: number; lastInsertRowid: number | bigint };
	query<TRow = Record<string, unknown>, TParams extends unknown[] = unknown[]>(
		sql: string,
	): {
		get(...bindings: TParams): TRow | null;
		all(...bindings: TParams): TRow[];
	};
	prepare(sql: string): {
		run(...bindings: unknown[]): {
			changes: number;
			lastInsertRowid: number | bigint;
		};
		get<T = unknown>(...bindings: unknown[]): T | null;
		all<T = unknown>(...bindings: unknown[]): T[];
	};
	transaction<T extends (...args: never[]) => unknown>(fn: T): T;
	close(): void;
};

function normalizeBindings(bindings: unknown[]): unknown[] {
	if (bindings.length === 1 && Array.isArray(bindings[0])) return bindings[0];
	return bindings;
}

export function openSqlite(path: string): Database {
	// biome-ignore lint/suspicious/noExplicitAny: bridging node:sqlite native types
	const raw = new DatabaseSync(path) as any;
	raw.exec("PRAGMA foreign_keys = OFF");

	let txDepth = 0;

	return {
		exec(sql: string) {
			raw.exec(sql);
		},
		run(sql: string, ...bindings: unknown[]) {
			if (bindings.length === 0) {
				raw.exec(sql);
				return { changes: 0, lastInsertRowid: 0 };
			}
			const params = normalizeBindings(bindings);
			raw.prepare(sql).run(...(params as any));
			return (
				raw
					.prepare(
						"SELECT changes() as changes, last_insert_rowid() as lastInsertRowid",
					)
					.get() ?? { changes: 0, lastInsertRowid: 0 }
			);
		},
		query(sql: string) {
			const stmt = raw.prepare(sql);
			return {
				get(...bindings: unknown[]) {
					const params = normalizeBindings(bindings);
					return stmt.get(...(params as any)) ?? null;
				},
				all(...bindings: unknown[]) {
					const params = normalizeBindings(bindings);
					return stmt.all(...(params as any));
				},
			};
		},
		prepare(sql: string) {
			const stmt = raw.prepare(sql);
			return {
				run(...bindings: unknown[]) {
					const params = normalizeBindings(bindings);
					return stmt.run(...(params as any));
				},
				// biome-ignore lint/suspicious/noExplicitAny: generic bridging
				get(...bindings: unknown[]) {
					return (stmt.get(...bindings) as any) ?? null;
				},
				// biome-ignore lint/suspicious/noExplicitAny: generic bridging
				all(...bindings: unknown[]) {
					return stmt.all(...bindings) as any;
				},
			};
		},
		transaction<T extends (...args: never[]) => unknown>(fn: T): T {
			return ((...args: Parameters<T>) => {
				txDepth++;
				if (txDepth === 1) raw.exec("BEGIN");
				else raw.exec(`SAVEPOINT sp_${txDepth}`);
				try {
					const result = fn(...args);
					if (txDepth === 1) raw.exec("COMMIT");
					else raw.exec(`RELEASE sp_${txDepth}`);
					return result;
					// biome-ignore lint/suspicious/noExplicitAny: re-throw merge
				} catch (e: any) {
					if (txDepth === 1) raw.exec("ROLLBACK");
					else raw.exec(`ROLLBACK TO sp_${txDepth}`);
					throw e;
				} finally {
					txDepth--;
				}
			}) as T;
		},
		close() {
			raw.close();
		},
	} as any as Database;
}

/**
 * Bun-compatible SQLite facade over Node's built-in `node:sqlite`.
 *
 * Call sites keep `.exec` / `.run` / `.query().get|all` / `.prepare().run` /
 * `.transaction`. The API contract is intentionally the same shape as the
 * `better-sqlite3`-based facade used by `site/auth` so that sqlite tests
 * stay portable between the two sites. The two implementations use different
 * underlying libraries because:
 *
 * - `site/auth` depends on `better-sqlite3` as a direct dependency and
 *   benefits from its mature C++ implementation.
 * - `site/platform-spec` uses the Node.js built-in `node:sqlite` (DatabaseSync)
 *   to keep the dependency tree light and stay Bun-compatible (Bun polyfills
 *   `node:sqlite` natively, while `better-sqlite3` is a native addon).
 *
 * Both facades enforce `PRAGMA foreign_keys = OFF` so callers manage
 * referential integrity explicitly in application code.
 */
import { DatabaseSync } from "node:sqlite";

export type SqlValue = string | number | bigint | null | Uint8Array;

export interface SqliteStatement {
	run(...params: Array<SqlValue | Record<string, SqlValue>>): void;
	get(...params: Array<SqlValue | Record<string, SqlValue>>): unknown;
	all(...params: Array<SqlValue | Record<string, SqlValue>>): unknown[];
}

export interface SqliteDatabase {
	exec(sql: string): void;
	run(sql: string, ...params: SqlValue[]): void;
	query<TRow = Record<string, unknown>, TParams extends SqlValue[] = SqlValue[]>(
		sql: string,
	): {
		get(...params: TParams): TRow | null;
		all(...params: TParams): TRow[];
	};
	prepare(sql: string): SqliteStatement;
	transaction<T>(fn: () => T): () => T;
	close(): void;
}

function normalizeParams(
	params: Array<SqlValue | Record<string, SqlValue>>,
): SqlValue[] | Record<string, SqlValue> {
	if (params.length === 1 && params[0] && typeof params[0] === "object" && !ArrayBuffer.isView(params[0])) {
		return params[0] as Record<string, SqlValue>;
	}
	return params as SqlValue[];
}

function wrapStatement(statement: ReturnType<DatabaseSync["prepare"]>): SqliteStatement {
	return {
		run(...params) {
			const normalized = normalizeParams(params);
			if (Array.isArray(normalized)) {
				statement.run(...normalized);
			} else {
				statement.run(normalized);
			}
		},
		get(...params) {
			const normalized = normalizeParams(params);
			if (Array.isArray(normalized)) {
				return statement.get(...normalized) ?? null;
			}
			return statement.get(normalized) ?? null;
		},
		all(...params) {
			const normalized = normalizeParams(params);
			if (Array.isArray(normalized)) {
				return statement.all(...normalized) as unknown[];
			}
			return statement.all(normalized) as unknown[];
		},
	};
}

export function openSqlite(path: string): SqliteDatabase {
	const db = new DatabaseSync(path);
	db.exec("PRAGMA foreign_keys = OFF");
	return {
		exec(sql) {
			db.exec(sql);
		},
		run(sql, ...params) {
			if (params.length === 0) {
				db.exec(sql);
				return;
			}
			wrapStatement(db.prepare(sql)).run(...params);
		},
		query(sql) {
			const statement = wrapStatement(db.prepare(sql));
			return {
				get(...params) {
					return statement.get(...params) as never;
				},
				all(...params) {
					return statement.all(...params) as never;
				},
			};
		},
		prepare(sql) {
			return wrapStatement(db.prepare(sql));
		},
		transaction(fn) {
			return () => {
				db.exec("BEGIN");
				try {
					const result = fn();
					db.exec("COMMIT");
					return result;
				} catch (error) {
					db.exec("ROLLBACK");
					throw error;
				}
			};
		},
		close() {
			db.close();
		},
	};
}

/** @deprecated Compatibility alias while call sites migrate off bun:sqlite types. */
export type Database = SqliteDatabase;

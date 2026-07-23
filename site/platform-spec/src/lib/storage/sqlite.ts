/**
 * Bun-compatible SQLite facade over Node's built-in `node:sqlite`.
 * Call sites keep `.run` / `.query().get|all` / `.prepare().run` / `.transaction`.
 */
import { DatabaseSync } from "node:sqlite";

export type SqlValue = string | number | bigint | null | Uint8Array;

export interface SqliteStatement {
	run(...params: Array<SqlValue | Record<string, SqlValue>>): void;
	get(...params: Array<SqlValue | Record<string, SqlValue>>): unknown;
	all(...params: Array<SqlValue | Record<string, SqlValue>>): unknown[];
}

export interface SqliteDatabase {
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
	return {
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

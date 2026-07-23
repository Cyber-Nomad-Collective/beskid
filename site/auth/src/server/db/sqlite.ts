import BetterSqlite3 from "better-sqlite3";

const DEFAULT_BUSY_TIMEOUT_MS = 0;

type Transaction<Arguments extends unknown[], Result> = {
	(...args: Arguments): Result;
	default(...args: Arguments): Result;
	deferred(...args: Arguments): Result;
	immediate(...args: Arguments): Result;
	exclusive(...args: Arguments): Result;
};

export interface OpenSqliteOptions {
	busyTimeoutMs?: number;
	readonly?: boolean;
	fileMustExist?: boolean;
}

export interface RunResult {
	changes: number;
	lastInsertRowid: number | bigint;
}

/** Synchronous SQLite boundary for Node-hosted Beskid services. */
class NodeSqliteDatabase {
	readonly #database: BetterSqlite3.Database;

	constructor(path: string, options: OpenSqliteOptions = {}) {
		const databaseOptions: BetterSqlite3.Options = {
			timeout: options.busyTimeoutMs ?? DEFAULT_BUSY_TIMEOUT_MS,
		};
		if (options.readonly !== undefined) {
			databaseOptions.readonly = options.readonly;
		}
		if (options.fileMustExist !== undefined) {
			databaseOptions.fileMustExist = options.fileMustExist;
		}
		this.#database = new BetterSqlite3(path, databaseOptions);
		this.#database.pragma("foreign_keys = OFF");
	}

	exec(source: string): this {
		this.#database.exec(source);
		return this;
	}

	prepare<BindParameters extends unknown[] = unknown[], Result = unknown>(
		source: string,
	): BetterSqlite3.Statement<BindParameters, Result> {
		return this.#database.prepare<BindParameters, Result>(source);
	}

	query<Result = unknown, BindParameters extends unknown[] = unknown[]>(
		source: string,
	): BetterSqlite3.Statement<BindParameters, Result> {
		return this.#database.prepare<BindParameters, Result>(source);
	}

	run(source: string, ...params: unknown[]): RunResult {
		if (params.length === 0) {
			this.#database.exec(source);
			return { changes: 0, lastInsertRowid: 0 };
		}

		const bindings =
			params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
		return this.#database.prepare<unknown[]>(source).run(...bindings);
	}

	transaction<Arguments extends unknown[], Result>(
		fn: (...args: Arguments) => Result,
	): Transaction<Arguments, Result> {
		return this.#database.transaction(fn);
	}

	close(): void {
		this.#database.close();
	}
}

export type Database = NodeSqliteDatabase;

export function openSqlite(
	path: string,
	options: OpenSqliteOptions = {},
): Database {
	return new NodeSqliteDatabase(path, options);
}

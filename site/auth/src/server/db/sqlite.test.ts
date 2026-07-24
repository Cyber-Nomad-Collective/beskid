import { describe, expect, it } from "vitest";

import { openSqlite } from "#/server/db/sqlite";

describe("openSqlite", () => {
	it("preserves synchronous prepared-statement and transaction semantics", () => {
		const db = openSqlite(":memory:");
		try {
			expect(
				db.query<{ timeout: number }, []>("PRAGMA busy_timeout").get(),
			).toEqual({ timeout: 0 });
			expect(
				db.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get(),
			).toEqual({ foreign_keys: 0 });
			db.exec("create table entries (id text primary key)");
			db.prepare("insert into entries values (?)").run("one");

			expect(db.prepare("select id from entries").get()).toEqual({ id: "one" });

			const insert = db.transaction((id: string) => {
				db.prepare("insert into entries values (?)").run(id);
			});
			expect(() => insert("one")).toThrow();
			expect(db.prepare("select count(*) as count from entries").get()).toEqual({
				count: 1,
			});
		} finally {
			db.close();
		}
	});

	it("executes migration batches and array-bound statements synchronously", () => {
		const db = openSqlite(":memory:");
		try {
			db.run(`
				create table entries (id text primary key);
				create table audit (entry_id text not null);
			`);
			db.run("insert into entries values (?)", ["one"]);

			expect(db.query<{ id: string }, []>("select id from entries").get()).toEqual(
				{
					id: "one",
				},
			);
		} finally {
			db.close();
		}
	});
});

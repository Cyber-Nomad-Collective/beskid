import { describe, expect, it } from "vitest";

import { buildSeedWorkspace } from "#/lib/spec/static";
import { readSeedRevision, seedSpecStore } from "#/lib/storage/spec-store";
import { openSqlite } from "#/lib/storage/sqlite";

describe("seedSpecStore", () => {
	it("writes the generated workspace through Node SQLite named bindings", () => {
		const db = openSqlite(":memory:");
		try {
			const workspace = buildSeedWorkspace().workspace;
			const result = seedSpecStore(db, workspace);

			expect(result.capabilities).toBe(workspace.catalog.entries.length);
			expect(readSeedRevision(db)).toBe(workspace.meta.revision);
		} finally {
			db.close();
		}
	});
});

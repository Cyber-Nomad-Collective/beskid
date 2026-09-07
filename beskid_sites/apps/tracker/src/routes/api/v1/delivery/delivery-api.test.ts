import { describe, expect, test } from "vitest";
import { migrateSchema } from "#/lib/storage/schema";
import type { Database } from "#/lib/storage/sqlite";
import { openSqlite } from "#/lib/storage/sqlite";
import { upsertTrackerVersion } from "#/lib/tracker/repositories/versions-repository";
import { deliveryByVersion, latestDelivery } from "./latest";

function fixtureDb(): Database {
	const db = openSqlite(":memory:");
	migrateSchema(db);
	for (const [id, status, visibility, catalogRevision] of [
		["v0.4", "Released", "public", "catalog-4"],
		["v0.5", "Released", "public", "catalog-5"],
		["v0.6", "In Progress", "public", "catalog-6"],
		["v0.7", "Released", "internal", "catalog-7"],
	] as const) {
		upsertTrackerVersion(
			db,
			{
				id,
				title: `Version ${id}`,
				summary: "Fixture release",
				theme: "delivery",
				status,
				cutoff: {
					startDate: "2026-01-01",
					endDate: "2026-01-02",
					endCommitSha: "abcdef1",
					endCommitRepo: "beskid",
					rationale: "fixture",
				},
			},
			{ visibility, catalogRevision },
		);
	}
	return db;
}

describe("delivery API", () => {
	test("returns only newest public released version", async () => {
		expect(await latestDelivery(fixtureDb())).toMatchObject({
			version: "0.5.0",
			catalogRevision: "catalog-5",
			status: "Released",
			canonicalUrl: "/versions/v0.5",
		});
	});

	test("rejects unknown and non-public delivery versions", async () => {
		const db = fixtureDb();
		await expect(deliveryByVersion(db, "0.6.0")).resolves.toBeNull();
		await expect(deliveryByVersion(db, "0.9.0")).resolves.toBeNull();
	});
});

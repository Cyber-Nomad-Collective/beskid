import { describe, expect, it } from "vitest";

import {
	enrichCatalogEntry,
	indexedReposOutsideCatalog,
	normalizeGitRepoUrl,
} from "../../src/lib/catalog-match";
import type { BackendRepo } from "../../src/services/backend-client";
import type { PublicCatalogEntry } from "../../src/services/nexus-api";

const baseEntry = (
	overrides: Partial<PublicCatalogEntry> = {},
): PublicCatalogEntry => ({
	id: "beskid-lang",
	displayName: "Beskid",
	description: "",
	gitUrl: "https://github.com/cyber-nomad-collective/beskid",
	sortOrder: 0,
	indexed: false,
	...overrides,
});

const baseRepo = (overrides: Partial<BackendRepo> = {}): BackendRepo => ({
	name: "beskid",
	path: "/data/repos/beskid",
	remoteUrl: "https://github.com/cyber-nomad-collective/beskid.git",
	indexedAt: "2026-01-01T00:00:00.000Z",
	...overrides,
});

describe("normalizeGitRepoUrl", () => {
	it("strips .git suffix and trailing slash", () => {
		expect(normalizeGitRepoUrl("https://github.com/org/repo.git/")).toBe(
			"https://github.com/org/repo",
		);
	});
});

describe("enrichCatalogEntry", () => {
	it("links catalog row to registry repo by remote URL when ids differ", () => {
		const enriched = enrichCatalogEntry(baseEntry(), [baseRepo()]);
		expect(enriched.indexed).toBe(true);
		expect(enriched.registryName).toBe("beskid");
	});

	it("links by git URL basename when remote URL is missing", () => {
		const enriched = enrichCatalogEntry(baseEntry(), [
			baseRepo({ remoteUrl: undefined, name: "beskid" }),
		]);
		expect(enriched.indexed).toBe(true);
		expect(enriched.registryName).toBe("beskid");
	});
});

describe("indexedReposOutsideCatalog", () => {
	it("returns repos not matched to any catalog entry", () => {
		const entries = [baseEntry({ indexed: true, registryName: "beskid" })];
		const repos = [
			baseRepo(),
			baseRepo({ name: "compiler", path: "/data/compiler" }),
		];
		const extra = indexedReposOutsideCatalog(entries, repos);
		expect(extra.map((r) => r.name)).toEqual(["compiler"]);
	});
});

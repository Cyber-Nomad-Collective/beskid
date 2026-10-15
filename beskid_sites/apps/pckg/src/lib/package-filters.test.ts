import { describe, expect, it } from "vitest";
import type { PackageSummary } from "#/lib/pckg-api";
import {
	filterPackages,
	isStandardLibrary,
	kindCounts,
	parseKindFilter,
	parsePackageSort,
	visibleTags,
} from "./package-filters";

function pkg(over: Partial<PackageSummary>): PackageSummary {
	return {
		id: over.name ?? "id",
		name: "corelib_http",
		packageKind: "library",
		template: null,
		description: "Strict bounded HTTP/1.1 protocol framing",
		category: "Library",
		repositoryUrl: null,
		websiteUrl: null,
		tags: ["corelib", "http", "beskid"],
		totalDownloads: 0,
		updatedAtUtc: "2026-10-01T00:00:00Z",
		ownerDisplayName: "beskid",
		community: null,
		...over,
	};
}

const items = [
	pkg({ name: "corelib_http", totalDownloads: 5 }),
	pkg({
		name: "corelib_console",
		description: "Terminal and ANSI helpers",
		tags: ["corelib", "console"],
		updatedAtUtc: "2026-09-19T00:00:00Z",
		totalDownloads: 9,
	}),
	pkg({
		name: "beskid.templates.console",
		packageKind: "template",
		description: "Executable console application",
		tags: ["template", "console", "beskid"],
		updatedAtUtc: "2026-10-05T00:00:00Z",
	}),
];

describe("filterPackages", () => {
	it("requires every query term across name, description and tags", () => {
		const names = (query: string) =>
			filterPackages(items, { query, kind: "all", sort: "name" }).map(
				(item) => item.name,
			);
		expect(names("console")).toEqual([
			"beskid.templates.console",
			"corelib_console",
		]);
		expect(names("console template")).toEqual(["beskid.templates.console"]);
		expect(names("HTTP/1.1")).toEqual(["corelib_http"]);
		expect(names("nothing")).toEqual([]);
	});

	it("filters by kind and sorts by update time or downloads", () => {
		expect(
			filterPackages(items, { query: "", kind: "template", sort: "name" }).map(
				(i) => i.name,
			),
		).toEqual(["beskid.templates.console"]);
		expect(
			filterPackages(items, { query: "", kind: "all", sort: "updated" }).map(
				(i) => i.name,
			),
		).toEqual(["beskid.templates.console", "corelib_http", "corelib_console"]);
		expect(
			filterPackages(items, { query: "", kind: "all", sort: "downloads" })[0].name,
		).toBe("corelib_console");
	});
});

describe("kindCounts", () => {
	it("counts the query matches per kind", () => {
		expect(kindCounts(items, "console")).toEqual({
			all: 2,
			library: 1,
			template: 1,
			tool: 0,
		});
	});
});

describe("search parameter parsing and helpers", () => {
	it("falls back to defaults for unknown values", () => {
		expect(parseKindFilter("library")).toBe("library");
		expect(parseKindFilter("widgets")).toBe("all");
		expect(parsePackageSort("downloads")).toBe("downloads");
		expect(parsePackageSort(undefined)).toBe("name");
	});

	it("recognizes the standard library and hides the universal beskid tag", () => {
		expect(isStandardLibrary(pkg({ name: "corelib" }))).toBe(true);
		expect(isStandardLibrary(pkg({ name: "corelib_http" }))).toBe(true);
		expect(isStandardLibrary(pkg({ name: "corelibx" }))).toBe(false);
		expect(visibleTags(items[0])).toEqual(["corelib", "http"]);
	});
});

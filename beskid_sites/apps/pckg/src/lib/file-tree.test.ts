import { describe, expect, it } from "vitest";
import {
	ancestorDirectories,
	buildFileTree,
	defaultFile,
	formatBytes,
} from "./file-tree";

const entries = [
	{ path: "src/main.bd", sizeBytes: 12 },
	{ path: "README.md", sizeBytes: 3 },
	{ path: "src/collections/list.bd", sizeBytes: 40 },
	{ path: "acme_math.bproj", sizeBytes: 20 },
	{ path: ".beskid/docs/api.json", sizeBytes: 500 },
];

describe("buildFileTree", () => {
	it("nests archive paths into directories first, then files, alphabetically", () => {
		const tree = buildFileTree(entries);
		expect(tree.map((entry) => `${entry.kind}:${entry.path}`)).toEqual([
			"dir:.beskid",
			"dir:src",
			"file:acme_math.bproj",
			"file:README.md",
		]);
		const src = tree.find((entry) => entry.path === "src");
		expect(src?.children?.map((entry) => entry.path)).toEqual([
			"src/collections",
			"src/main.bd",
		]);
		expect(src?.children?.[0]?.children?.[0]).toMatchObject({
			path: "src/collections/list.bd",
			kind: "file",
		});
	});
});

describe("helpers", () => {
	it("lists ancestor directories and picks a sensible default file", () => {
		expect(ancestorDirectories("src/collections/list.bd")).toEqual([
			"src",
			"src/collections",
		]);
		expect(defaultFile(entries)).toBe("README.md");
		expect(
			defaultFile(entries.filter((entry) => entry.path !== "README.md")),
		).toBe("acme_math.bproj");
		expect(defaultFile([])).toBeNull();
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(2048)).toBe("2.0 KiB");
	});
});

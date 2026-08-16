import { describe, expect, it } from "vitest";

import {
	clearManifestCache,
	loadManifest,
	validateSources,
} from "#/lib/manifest/loader";
import type {
	ManifestChapter,
	ManifestEntry,
	ManifestSection,
} from "#/lib/manifest/types";

function findChapter(chapters: ManifestChapter[], id: string): ManifestChapter {
	const chapter = chapters.find((item) => item.id === id);
	if (!chapter) throw new Error(`Chapter ${id} not found`);
	return chapter;
}

function findSection(chapter: ManifestChapter, id: string): ManifestSection {
	const section = chapter.sections.find((item) => item.id === id);
	if (!section) throw new Error(`Section ${id} not found`);
	return section;
}

describe("Normative Manifest loader", () => {
	it("loads all five chapters in declared order", () => {
		clearManifestCache();
		const manifest = loadManifest();
		const ids = manifest.chapters.map((chapter) => chapter.id);
		expect(ids).toEqual([
			"introduction",
			"syntax-index",
			"corelib-runtime",
			"isle-lowering",
			"error-index",
		]);
		for (const chapter of manifest.chapters) {
			expect(chapter.title).toBeTruthy();
			expect(chapter.sections.length).toBeGreaterThan(0);
		}
	});

	it("every entry has at least one source reference", () => {
		clearManifestCache();
		const manifest = loadManifest();
		for (const chapter of manifest.chapters) {
			for (const section of chapter.sections) {
				for (const entry of section.entries) {
					expect(
						entry.references.sources.length,
						`${chapter.id}/${section.id}/${entry.id} must have a source`,
					).toBeGreaterThan(0);
				}
			}
		}
	});

	it("every entry has at least one capability reference", () => {
		clearManifestCache();
		const manifest = loadManifest();
		for (const chapter of manifest.chapters) {
			for (const section of chapter.sections) {
				for (const entry of section.entries) {
					expect(
						entry.references.capabilities.length,
						`${chapter.id}/${section.id}/${entry.id} must have a capability`,
					).toBeGreaterThan(0);
				}
			}
		}
	});

	it("rejects an entry that has no capability reference", () => {
		const entry: ManifestEntry = {
			id: "bad",
			title: "Bad",
			description: "",
			references: { capabilities: [], sources: ["compiler/foo.rs"] },
		};
		const chapter: ManifestChapter = {
			id: "c",
			title: "C",
			order: 0,
			sections: [
				{
					id: "s",
					title: "S",
					entries: [entry],
				},
			],
		};
		expect(() => validateSources([chapter])).toThrow(
			/has no capability reference/,
		);
	});

	it("rejects an entry that has no source reference", () => {
		const entry: ManifestEntry = {
			id: "bad",
			title: "Bad",
			description: "",
			references: {
				capabilities: ["language-meta--surface-syntax--lexical-and-syntax"],
				sources: [],
			},
		};
		const chapter: ManifestChapter = {
			id: "c",
			title: "C",
			order: 0,
			sections: [
				{
					id: "s",
					title: "S",
					entries: [entry],
				},
			],
		};
		expect(() => validateSources([chapter])).toThrow(
			/has no source file reference/,
		);
	});

	it("syntax index covers all major construct categories", () => {
		clearManifestCache();
		const manifest = loadManifest();
		const syntax = findChapter(manifest.chapters, "syntax-index");
		const sectionIds = syntax.sections.map((section) => section.id);
		expect(sectionIds).toContain("lexical-layer");
		expect(sectionIds).toContain("program-and-module-structure");
		expect(sectionIds).toContain("type-system");
		expect(sectionIds).toContain("item-declarations");
		expect(sectionIds).toContain("statements");
		expect(sectionIds).toContain("expressions");
	});

	it("syntax index entries have examples and pest rules metadata", () => {
		clearManifestCache();
		const manifest = loadManifest();
		const syntax = findChapter(manifest.chapters, "syntax-index");
		const lexical = findSection(syntax, "lexical-layer");
		for (const entry of lexical.entries) {
			expect(entry.examples).toBeDefined();
			expect(entry.examples?.length).toBeGreaterThan(0);
			expect(entry.metadata?.pestRules).toBeDefined();
		}
	});

	it("introduction covers abfall, pest, cranelift, salsa, and fibers", () => {
		clearManifestCache();
		const manifest = loadManifest();
		const intro = findChapter(manifest.chapters, "introduction");
		const deps = findSection(intro, "compiler-dependencies");
		const ids = deps.entries.map((entry) => entry.id);
		expect(ids).toContain("abfall");
		expect(ids).toContain("pest");
		expect(ids).toContain("cranelift");
		expect(ids).toContain("salsa");
		expect(ids).toContain("fibers");
	});

	it("is memoized across calls", () => {
		clearManifestCache();
		const first = loadManifest();
		const second = loadManifest();
		expect(second).toBe(first);
	});

	it("error-index chapter exists with the correct order", () => {
		clearManifestCache();
		const manifest = loadManifest();
		const errorIndex = findChapter(manifest.chapters, "error-index");
		expect(errorIndex.order).toBe(5);
		expect(errorIndex.title).toBe("Error Index");
	});

	it("error-index chapter has at least one section", () => {
		clearManifestCache();
		const manifest = loadManifest();
		const errorIndex = findChapter(manifest.chapters, "error-index");
		expect(errorIndex.sections.length).toBeGreaterThan(0);
	});

	it("every error-index entry has at least one source and one capability reference", () => {
		clearManifestCache();
		const manifest = loadManifest();
		const errorIndex = findChapter(manifest.chapters, "error-index");
		for (const section of errorIndex.sections) {
			for (const entry of section.entries) {
				expect(
					entry.references.sources.length,
					`error-index/${section.id}/${entry.id} must have a source`,
				).toBeGreaterThan(0);
				expect(
					entry.references.capabilities.length,
					`error-index/${section.id}/${entry.id} must have a capability`,
				).toBeGreaterThan(0);
			}
		}
	});
});

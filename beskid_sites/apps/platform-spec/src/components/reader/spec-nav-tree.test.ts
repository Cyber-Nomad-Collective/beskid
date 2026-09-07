import { describe, expect, it } from "vitest";

import {
	createNavSearchResult,
	filterNavTree,
	findActivePath,
	highlightTitle,
	resolveTrappedFocusIndex,
	resolveTreeKey,
} from "#/components/reader/spec-nav-tree";
import type { OpenSpecNavNode } from "#/lib/spec/domain-model";

const tree: OpenSpecNavNode = {
	slug: "platform-spec",
	href: "/platform-spec/",
	title: "Platform specification",
	level: "root",
	children: [
		{
			slug: "compiler",
			href: "/platform-spec/compiler",
			title: "Compiler",
			level: "domain",
			children: [
				{
					slug: "compiler/frontend",
					href: "/platform-spec/compiler/frontend",
					title: "Frontend",
					level: "area",
					children: [
						{
							slug: "parser",
							href: "/platform-spec/parser",
							title: "Parser [v2]",
							level: "feature",
						},
					],
				},
			],
		},
		{
			slug: "runtime",
			href: "/platform-spec/runtime",
			title: "Runtime",
			level: "domain",
		},
	],
};

describe("filterNavTree", () => {
	it("matches titles case-insensitively while retaining their ancestors", () => {
		const filtered = filterNavTree(tree, "  PARSER  ");

		expect(filtered).toEqual({
			...tree,
			children: [
				{
					...tree.children?.[0],
					children: [
						{
							...tree.children?.[0].children?.[0],
							children: [tree.children?.[0].children?.[0].children?.[0]],
						},
					],
				},
			],
		});
		expect(filtered).not.toBe(tree);
		expect(tree.children).toHaveLength(2);
	});

	it("treats regex punctuation as literal search text and hides unrelated branches", () => {
		const filtered = filterNavTree(tree, "[v2]");

		expect(filtered?.children).toHaveLength(1);
		expect(filtered?.children?.[0]?.children?.[0]?.children?.[0]?.title).toBe(
			"Parser [v2]",
		);
		expect(filterNavTree(tree, "(missing)")).toBeNull();
	});
});

describe("createNavSearchResult", () => {
	it("counts only direct title matches, not preserved ancestors", () => {
		const result = createNavSearchResult(tree, "parser");

		expect(result.matchCount).toBe(1);
		expect(result.matchingSlugs).toEqual(new Set(["parser"]));
		expect(result.expandedSlugs).toEqual(
			new Set(["platform-spec", "compiler", "compiler/frontend"]),
		);
	});

	it("counts each matching title when more than one node matches", () => {
		const repeatedTree: OpenSpecNavNode = {
			...tree,
			children: [
				...tree.children!,
				{
					slug: "parser-runtime",
					href: "/platform-spec/parser-runtime",
					title: "Parser runtime",
					level: "feature",
				},
			],
		};

		expect(createNavSearchResult(repeatedTree, "parser").matchCount).toBe(2);
	});
});

describe("findActivePath", () => {
	it("returns every ancestor through the active node", () => {
		expect(findActivePath(tree, "parser")).toEqual([
			"platform-spec",
			"compiler",
			"compiler/frontend",
			"parser",
		]);
		expect(findActivePath(tree, "unknown")).toEqual([]);
	});
});

describe("highlightTitle", () => {
	it("returns safe string ranges for every case-insensitive literal match", () => {
		expect(highlightTitle("Parser [v2] parser", "PARSER")).toEqual([
			{ start: 0, end: 6, match: true },
			{ start: 6, end: 12, match: false },
			{ start: 12, end: 18, match: true },
		]);
	});

	it("preserves original title offsets when locale case folding expands a character", () => {
		expect(highlightTitle("AİB", "b")).toEqual([
			{ start: 0, end: 2, match: false },
			{ start: 2, end: 3, match: true },
		]);
	});

	it("maps whole-string Lithuanian case folding back to original title offsets", () => {
		expect(highlightTitle("I\u0301B", "i\u0307", "lt")).toEqual([
			{ start: 0, end: 1, match: true },
			{ start: 1, end: 3, match: false },
		]);
		expect(highlightTitle("I\u0301B", "b", "lt")).toEqual([
			{ start: 0, end: 2, match: false },
			{ start: 2, end: 3, match: true },
		]);
	});
});

describe("resolveTreeKey", () => {
	const expanded = new Set(["compiler", "compiler/frontend"]);

	it("moves through the visible items and to either boundary", () => {
		expect(
			resolveTreeKey(tree, expanded, "compiler/frontend", "ArrowDown"),
		).toEqual({ focusSlug: "parser" });
		expect(
			resolveTreeKey(tree, expanded, "compiler/frontend", "ArrowUp"),
		).toEqual({ focusSlug: "compiler" });
		expect(resolveTreeKey(tree, expanded, "parser", "Home")).toEqual({
			focusSlug: "compiler",
		});
		expect(resolveTreeKey(tree, expanded, "compiler", "End")).toEqual({
			focusSlug: "runtime",
		});
	});

	it("expands or enters children with Right and collapses or moves to the parent with Left", () => {
		expect(resolveTreeKey(tree, new Set(), "compiler", "ArrowRight")).toEqual({
			expandSlug: "compiler",
		});
		expect(resolveTreeKey(tree, expanded, "compiler", "ArrowRight")).toEqual({
			focusSlug: "compiler/frontend",
		});
		expect(
			resolveTreeKey(tree, expanded, "compiler/frontend", "ArrowLeft"),
		).toEqual({ collapseSlug: "compiler/frontend" });
		expect(
			resolveTreeKey(
				tree,
				new Set(["compiler"]),
				"compiler/frontend",
				"ArrowLeft",
			),
		).toEqual({ focusSlug: "compiler" });
	});

	it("activates the focused item with Enter", () => {
		expect(resolveTreeKey(tree, expanded, "parser", "Enter")).toEqual({
			activate: true,
		});
	});
});

describe("resolveTrappedFocusIndex", () => {
	it("wraps Tab and Shift+Tab at modal focus boundaries", () => {
		expect(resolveTrappedFocusIndex(3, 4, false)).toBe(0);
		expect(resolveTrappedFocusIndex(0, 4, true)).toBe(3);
		expect(resolveTrappedFocusIndex(-1, 4, false)).toBe(0);
		expect(resolveTrappedFocusIndex(1, 4, false)).toBeNull();
	});
});

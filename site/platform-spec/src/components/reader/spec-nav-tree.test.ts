import { describe, expect, it } from "vitest";

import {
	filterNavTree,
	findActivePath,
	highlightTitle,
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
					...tree.children![0],
					children: [
						{
							...tree.children![0].children![0],
							children: [tree.children![0].children![0].children![0]],
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
});

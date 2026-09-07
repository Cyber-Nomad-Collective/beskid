import { describe, expect, it } from "vitest";

import type { RoadmapTask } from "#/lib/github/types";
import type { FlatSpecNavEntry } from "#/lib/platform-spec/nav";
import { suggestPlatformSpecEntriesForTask } from "#/lib/platform-spec/suggestions";

const ENTRIES: FlatSpecNavEntry[] = [
	{
		slug: "compiler/foundation",
		href: "/platform-spec/compiler/foundation/",
		title: "Compiler foundation",
		level: "feature",
		domain: "compiler",
		area: "foundation",
		feature: "foundation",
	},
	{
		slug: "compiler/lsp/project-graph",
		href: "/platform-spec/compiler/lsp/project-graph/",
		title: "LSP project graph",
		level: "feature",
		domain: "compiler",
		area: "lsp",
		feature: "project-graph",
	},
	{
		slug: "tooling/editor-extension",
		href: "/platform-spec/tooling/editor-extension/",
		title: "Editor extension",
		level: "feature",
		domain: "tooling",
		area: "editor",
		feature: "editor-extension",
	},
];

function makeTask(patch: Partial<RoadmapTask>): RoadmapTask {
	return {
		id: "1",
		number: 12,
		title: "LSP graph integration",
		owner: "octocat",
		priority: "medium",
		statusColumn: "Backlog",
		body: "Build workspace project graph support for lsp.",
		specRelations: [],
		subtasks: [],
		specApproval: "pending",
		version: "v0.3",
		htmlUrl: "https://example.com/issue/12",
		labelNames: [],
		...patch,
	};
}

describe("suggestPlatformSpecEntriesForTask", () => {
	it("prioritizes scoped and lexical matches", () => {
		const task = makeTask({
			domain: "compiler",
			area: "lsp",
			feature: "project-graph",
		});
		const suggestions = suggestPlatformSpecEntriesForTask(ENTRIES, task, 3);

		expect(suggestions).toHaveLength(2);
		expect(suggestions[0]?.entry.slug).toBe("compiler/lsp/project-graph");
	});

	it("marks already-linked entries without dropping them", () => {
		const task = makeTask({
			specRelations: [
				{
					path: "/platform-spec/compiler/lsp/project-graph",
					href: "/platform-spec/compiler/lsp/project-graph/",
					title: "LSP project graph",
					level: "feature",
					relation: "implements",
					required: true,
				},
			],
		});
		const suggestions = suggestPlatformSpecEntriesForTask(ENTRIES, task, 5);
		const linked = suggestions.find(
			(entry) => entry.entry.slug === "compiler/lsp/project-graph",
		);

		expect(linked?.alreadyLinked).toBe(true);
	});

	it("keeps ordering stable for equal scores", () => {
		const task = makeTask({
			title: "editor",
			body: "editor",
			domain: undefined,
			area: undefined,
			feature: undefined,
		});
		const suggestionsA = suggestPlatformSpecEntriesForTask(ENTRIES, task, 2);
		const suggestionsB = suggestPlatformSpecEntriesForTask(ENTRIES, task, 2);

		expect(suggestionsA.map((it) => it.entry.href)).toEqual(
			suggestionsB.map((it) => it.entry.href),
		);
	});
});

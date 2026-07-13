import { describe, expect, it } from "vitest";

import type { DraftChangeNode } from "#/server/memgraph/types";
import { buildOpenSpecChangeFiles } from "./pr";

function draft(): DraftChangeNode {
	return {
		id: "12345678-1234-1234-1234-123456789abc",
		title: "Define widget behavior",
		summary: "Make widget behavior normative.",
		changeKind: "create",
		repoPath: "",
		slug: "platform-spec/language/runtime/widgets",
		pathClass: "feature",
		specLevel: "feature",
		frontmatterJson: "{}",
		bodyMd: "Widgets SHALL remain deterministic.",
		layoutJson: null,
		status: "approved",
		authorLogin: "maintainer",
		moderatorLogin: "reviewer",
		rejectReason: null,
		headBranch: null,
		prNumber: null,
		prUrl: null,
		createdAt: "2026-07-13T00:00:00.000Z",
		updatedAt: "2026-07-13T00:00:00.000Z",
	};
}

describe("OpenSpec draft pull request files", () => {
	it("writes only an OpenSpec change proposal, tasks, and capability delta", () => {
		const files = buildOpenSpecChangeFiles(draft());
		expect(files.map((file) => file.path)).toEqual([
			"openspec/changes/platform-editor-12345678/.openspec.yaml",
			"openspec/changes/platform-editor-12345678/proposal.md",
			"openspec/changes/platform-editor-12345678/tasks.md",
			"openspec/changes/platform-editor-12345678/specs/language--runtime--widgets/spec.md",
		]);
		expect(files.map((file) => file.path).join("\n")).not.toMatch(
			/(node\.json|content\.md|layout\.json)/,
		);
		expect(files.at(-1)?.content).toContain("## ADDED Requirements");
		expect(files.at(-1)?.content).toContain("#### Scenario:");
	});
});

import "@tanstack/react-start/server-only";

import fs from "node:fs";
import path from "node:path";

import {
	normativePathsForSlug,
	readNodeMarkdown,
	SPEC_NODE_FILE,
	writeNodeMarkdown,
} from "@cyber-nomad-collective/spec-core";

import { localContentRoot } from "#/lib/storage/paths";
import type { DraftChangeNode } from "#/server/memgraph/types";

export interface ExportResult {
	contentRoot: string;
	exportedPaths: string[];
}

function nodeDirFromDraft(draft: DraftChangeNode, contentRoot: string): string {
	const rel = draft.slug.replace(/^platform-spec\/?/, "");
	return path.join(contentRoot, rel || ".");
}

export function exportApprovedDraft(draft: DraftChangeNode): ExportResult {
	const contentRoot = localContentRoot();
	fs.mkdirSync(contentRoot, { recursive: true });

	const exportedPaths: string[] = [];
	const paths = normativePathsForSlug(draft.slug);
	const nodeDir = nodeDirFromDraft(draft, contentRoot);

	if (draft.changeKind === "delete") {
		for (const repoPath of Object.values(paths)) {
			const abs = path.join(contentRoot, repoPath);
			if (fs.existsSync(abs)) {
				fs.unlinkSync(abs);
				exportedPaths.push(repoPath);
			}
		}
		return { contentRoot, exportedPaths };
	}

	fs.mkdirSync(nodeDir, { recursive: true });

	const nodeMeta = {
		version: 1 as const,
		specLevel: draft.specLevel,
		slug: draft.slug,
		title: draft.title,
		parentSlug: draft.slug.includes("/")
			? draft.slug.replace(/\/[^/]+$/, "")
			: "platform-spec",
		status: "review",
	};

	fs.writeFileSync(
		path.join(nodeDir, SPEC_NODE_FILE),
		`${JSON.stringify(nodeMeta, null, 2)}\n`,
	);
	exportedPaths.push(paths.nodeJson);

	writeNodeMarkdown(nodeDir, draft.bodyMd);
	exportedPaths.push(paths.contentMd);

	if (draft.layoutJson) {
		const layoutAbs = path.join(nodeDir, "layout.json");
		fs.writeFileSync(layoutAbs, draft.layoutJson, "utf8");
		exportedPaths.push(paths.layoutJson);
	}

	return { contentRoot, exportedPaths };
}

export function repoPathForDraft(draft: DraftChangeNode): string {
	return normativePathsForSlug(draft.slug).contentMd;
}

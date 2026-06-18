import "@tanstack/react-start/server-only";

import fs from "node:fs";
import path from "node:path";

import {
	hrefToSlug,
	nodeMetadataToFrontmatter,
	parseNodeDocument,
	parseRelatedFile,
	parseWorkspaceManifest,
	SPEC_LAYOUT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_RELATED_FILE,
	SPEC_WORKSPACE_MANIFEST,
	type NodeMetadata,
} from "@cyber-nomad-collective/spec-core";
import {
	parentSlugFromNodeRel,
	pathClassFromNodeRel,
} from "@cyber-nomad-collective/spec-core/node-path";
import { slugToHref } from "@cyber-nomad-collective/spec-core";
import { ensureMemgraphReady } from "#/server/memgraph/client";
import {
	rebuildContainsEdges,
	rebuildRelatedEdges,
	type SpecDocumentUpsertInput,
	upsertSpecDocument,
} from "#/server/memgraph/documents";

export interface ImportJsonOptions {
	workspaceDir: string;
	sourceGitSha?: string | null;
}

export interface ImportJsonResult {
	documentCount: number;
	containsEdgeCount: number;
	relatedEdgeCount: number;
	sourceGitSha: string | null;
	workspaceDir: string;
}

function collectNodeDirs(contentRoot: string): string[] {
	const dirs: string[] = [];
	if (!fs.existsSync(contentRoot)) return dirs;

	function walk(dir: string) {
		if (fs.existsSync(path.join(dir, SPEC_MARKDOWN_FILE))) {
			dirs.push(dir);
		}
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				walk(path.join(dir, entry.name));
			}
		}
	}

	walk(contentRoot);
	return dirs;
}

function nodeToUpsert(
	node: NodeMetadata,
	bodyMd: string,
	layoutJson: string | null,
	contentJson: string | null,
	workspaceDir: string,
	manifestContentRoot: string,
	nodeDir: string,
	sourceGitSha: string | null,
	importedAt: string,
): SpecDocumentUpsertInput {
	const rel = path
		.relative(path.join(workspaceDir, manifestContentRoot), nodeDir)
		.split(path.sep)
		.join("/");
	const slug = rel ? `platform-spec/${rel}` : "platform-spec";
	const pathClass = pathClassFromNodeRel(rel || "");
	const parentSlug =
		node.parentSlug ?? parentSlugFromNodeRel(rel || "", pathClass);

	return {
		slug,
		specLevel: node.specLevel === "root" ? "domain" : node.specLevel,
		pathClass,
		title: node.title,
		description: node.description ?? null,
		status: node.status ?? null,
		adrId: node.adrId ?? null,
		adrStatus: node.adrStatus ?? null,
		repoPath: `site/platform-spec/content/docs/platform-spec/${rel}/content.md`,
		href: slugToHref(slug),
		parentSlug,
		bodyMd,
		frontmatterJson: JSON.stringify(nodeMetadataToFrontmatter(node)),
		layoutJson,
		contentJson,
		hasLayoutJson: Boolean(layoutJson),
		sourceGitSha,
		importedAt,
		publishedAt: importedAt,
		lastReviewed: node.lastReviewed ?? null,
	};
}

export async function importJsonWorkspace(
	options: ImportJsonOptions,
): Promise<ImportJsonResult> {
	await ensureMemgraphReady();

	const { workspaceDir, sourceGitSha = null } = options;
	const manifestPath = path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST);
	if (!fs.existsSync(manifestPath)) {
		throw new Error(`Missing ${manifestPath}`);
	}

	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(manifestPath, "utf8")),
		manifestPath,
	);
	const contentRoot = path.join(workspaceDir, manifest.contentRoot);
	const nodeDirs = collectNodeDirs(contentRoot);
	const importedAt = new Date().toISOString();

	const upserts: SpecDocumentUpsertInput[] = [];
	const contains: Array<{ slug: string; parentSlug: string | null }> = [];
	const related: Array<{ fromSlug: string; toSlug: string; relation: string }> =
		[];

	for (const nodeDir of nodeDirs) {
		const doc = parseNodeDocument({ nodeDir, workspaceDir, manifest });
		const node = doc.node;
		const layoutPath = path.join(nodeDir, SPEC_LAYOUT_FILE);
		const relatedPath = path.join(nodeDir, SPEC_RELATED_FILE);

		let contentJson: string | null = null;
		const bodyMd = doc.body;

		// content.json is deprecated in the content.md-only workspace format.
		// We keep contentJson unset and rely on content.md as the source of truth.

		const layoutJson = fs.existsSync(layoutPath)
			? fs.readFileSync(layoutPath, "utf8")
			: null;

		const upsert = nodeToUpsert(
			node,
			bodyMd,
			layoutJson,
			contentJson,
			workspaceDir,
			manifest.contentRoot,
			nodeDir,
			sourceGitSha,
			importedAt,
		);
		upserts.push(upsert);
		contains.push({ slug: upsert.slug, parentSlug: upsert.parentSlug });

		if (fs.existsSync(relatedPath)) {
			const relatedFile = parseRelatedFile(
				JSON.parse(fs.readFileSync(relatedPath, "utf8")),
				relatedPath,
			);
			for (const topic of relatedFile.topics) {
				related.push({
					fromSlug: upsert.slug,
					toSlug: hrefToSlug(topic.href),
					relation: topic.relation ?? "relatedTopic",
				});
			}
		}

		for (const topic of node.relatedTopics ?? []) {
			related.push({
				fromSlug: upsert.slug,
				toSlug: topic.replace(/^\//, "").startsWith("platform-spec")
					? topic.replace(/^\//, "")
					: `platform-spec/${topic.replace(/^\//, "")}`,
				relation: "relatedTopic",
			});
		}
	}

	for (const upsert of upserts) {
		await upsertSpecDocument(upsert);
	}

	await rebuildContainsEdges(contains);
	await rebuildRelatedEdges(related);

	return {
		documentCount: upserts.length,
		containsEdgeCount: contains.filter((c) => c.parentSlug).length,
		relatedEdgeCount: related.length,
		sourceGitSha,
		workspaceDir,
	};
}

export async function syncFromGitClone(): Promise<ImportJsonResult> {
	const { syncGitRepository } = await import("#/server/git-sync/clone");
	const git = syncGitRepository();
	return importJsonWorkspace({
		workspaceDir: git.cloneDir,
		sourceGitSha: git.headSha,
	});
}

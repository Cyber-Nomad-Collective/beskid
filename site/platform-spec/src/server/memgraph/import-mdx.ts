import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { classifyPlatformSpecRel } from "@cyber-nomad-collective/spec-core";
import {
	parentSlugFromPath,
	slugFromRepoPath,
	splitMdxFrontmatter,
} from "@cyber-nomad-collective/spec-core";
import { slugToHref } from "@cyber-nomad-collective/spec-core";
import { ensureMemgraphReady } from "#/server/memgraph/client";
import {
	rebuildContainsEdges,
	rebuildRelatedEdges,
	type SpecDocumentUpsertInput,
	upsertSpecDocument,
} from "#/server/memgraph/documents";

export interface ImportMdxOptions {
	contentRoot?: string;
	repoRoot?: string;
	sourceGitSha?: string | null;
}

export interface ImportMdxResult {
	documentCount: number;
	containsEdgeCount: number;
	relatedEdgeCount: number;
	sourceGitSha: string | null;
	contentRoot: string;
}

function defaultContentRoot(): string {
	if (process.env.PLATFORM_SPEC_CONTENT_ROOT?.trim()) {
		return path.resolve(process.env.PLATFORM_SPEC_CONTENT_ROOT);
	}
	/** Normative content source: site/spec-content (canonical submodule).
	 * Legacy website MDX fallback removed — the Astro platform-spec is retired. */
	return path.resolve(
		import.meta.dirname,
		"../../../../spec-content/platform-spec",
	);
}

function defaultRepoRoot(contentRoot: string): string {
	return path.resolve(contentRoot, "../../../..");
}

function resolveGitSha(repoRoot: string, override?: string | null): string | null {
	if (override) return override;
	try {
		return execSync("git rev-parse HEAD", {
			cwd: repoRoot,
			encoding: "utf8",
		}).trim();
	} catch {
		return null;
	}
}

function walkMdxFiles(dir: string, out: string[] = []): string[] {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) walkMdxFiles(abs, out);
		else if (/\.(md|mdx)$/i.test(entry.name)) out.push(abs);
	}
	return out;
}

function readLayoutJson(absFile: string): Record<string, unknown> | null {
	const layoutPath = path.join(path.dirname(absFile), "layout.json");
	if (!fs.existsSync(layoutPath)) return null;
	try {
		return JSON.parse(fs.readFileSync(layoutPath, "utf8")) as Record<
			string,
			unknown
		>;
	} catch {
		return null;
	}
}

function hrefToSlug(href: string): string | null {
	const trimmed = href.trim().replace(/\/+$/, "");
	if (!trimmed.startsWith("/platform-spec")) return null;
	return trimmed.replace(/^\//, "") || "platform-spec";
}

function parseDocument(
	absFile: string,
	contentRoot: string,
	sourceGitSha: string | null,
	importedAt: string,
): SpecDocumentUpsertInput {
	const relUnderSpec = path
		.relative(contentRoot, absFile)
		.split(path.sep)
		.join("/");
	/** Normative repo path (site/spec-content), not the legacy website path. */
	const repoPath = `platform-spec/${relUnderSpec}`;
	const slug = slugFromRepoPath(`site/spec-content/${repoPath}`);
	const pathClass = classifyPlatformSpecRel(
		relUnderSpec.replace(/\.(md|mdx)$/i, ""),
	);
	const raw = fs.readFileSync(absFile, "utf8");
	const { frontmatter, body } = splitMdxFrontmatter(raw);
	const layoutJson = readLayoutJson(absFile);
	const title =
		typeof frontmatter.title === "string" && frontmatter.title.trim() !== ""
			? frontmatter.title.trim()
			: (slug.split("/").filter(Boolean).at(-1) ?? slug);
	const description =
		typeof frontmatter.description === "string"
			? frontmatter.description
			: null;
	const specLevel =
		typeof frontmatter.specLevel === "string" ? frontmatter.specLevel : null;
	const status =
		typeof frontmatter.status === "string" ? frontmatter.status : null;
	const adrId = typeof frontmatter.adrId === "string" ? frontmatter.adrId : null;
	const adrStatus =
		typeof frontmatter.adrStatus === "string" ? frontmatter.adrStatus : null;
	const lastReviewed =
		frontmatter.lastReviewed != null
			? String(frontmatter.lastReviewed)
			: null;

	return {
		slug,
		specLevel,
		pathClass,
		title,
		description,
		status,
		adrId,
		adrStatus,
		repoPath,
		href: slugToHref(slug),
		parentSlug: parentSlugFromPath(slug, pathClass),
		bodyMd: body,
		frontmatterJson: JSON.stringify(frontmatter),
		layoutJson: layoutJson ? JSON.stringify(layoutJson) : null,
		contentJson: null,
		hasLayoutJson: layoutJson != null,
		sourceGitSha,
		importedAt,
		publishedAt: importedAt,
		lastReviewed,
	};
}

function collectRelatedEdges(
	documents: SpecDocumentUpsertInput[],
): Array<{ fromSlug: string; toSlug: string; relation: string }> {
	const edges: Array<{ fromSlug: string; toSlug: string; relation: string }> =
		[];
	const known = new Set(documents.map((doc) => doc.slug));

	for (const doc of documents) {
		let frontmatter: Record<string, unknown> = {};
		try {
			frontmatter = JSON.parse(doc.frontmatterJson) as Record<string, unknown>;
		} catch {
			continue;
		}
		const topics = frontmatter.relatedTopics;
		if (!Array.isArray(topics)) continue;
		for (const topic of topics) {
			if (!topic || typeof topic !== "object") continue;
			const href =
				typeof (topic as { href?: unknown }).href === "string"
					? (topic as { href: string }).href
					: null;
			if (!href) continue;
			const toSlug = hrefToSlug(href);
			if (!toSlug || !known.has(toSlug) || toSlug === doc.slug) continue;
			const relation =
				typeof (topic as { relation?: unknown }).relation === "string"
					? (topic as { relation: string }).relation
					: "related";
			edges.push({ fromSlug: doc.slug, toSlug, relation });
		}
	}

	return edges;
}

export async function importMdxToMemgraph(
	options: ImportMdxOptions = {},
): Promise<ImportMdxResult> {
	const contentRoot = path.resolve(options.contentRoot ?? defaultContentRoot());
	const repoRoot = path.resolve(options.repoRoot ?? defaultRepoRoot(contentRoot));
	const importedAt = new Date().toISOString();
	const sourceGitSha = resolveGitSha(repoRoot, options.sourceGitSha);

	if (!fs.existsSync(contentRoot)) {
		throw new Error(`Platform-spec content root not found: ${contentRoot}`);
	}

	await ensureMemgraphReady();

	const files = walkMdxFiles(contentRoot);
	const documents = files.map((absFile) =>
		parseDocument(absFile, contentRoot, sourceGitSha, importedAt),
	);

	for (const document of documents) {
		await upsertSpecDocument(document);
	}

	const contains = documents.map((doc) => ({
		slug: doc.slug,
		parentSlug: doc.parentSlug,
	}));
	await rebuildContainsEdges(contains);

	const related = collectRelatedEdges(documents);
	await rebuildRelatedEdges(related);

	return {
		documentCount: documents.length,
		containsEdgeCount: contains.filter((entry) => entry.parentSlug).length,
		relatedEdgeCount: related.length,
		sourceGitSha,
		contentRoot,
	};
}

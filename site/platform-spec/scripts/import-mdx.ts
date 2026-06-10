#!/usr/bin/env bun
/**
 * Import platform-spec MDX bundles from site/website generated catalog into Memgraph.
 * Run from site/platform-spec: bun run import:mdx
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	closeMemgraph,
	ensureMemgraphReady,
	runWrite,
} from "../src/server/memgraph/client";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const websiteGenerated = path.resolve(rootDir, "../website/src/generated");
const catalogPath = path.join(websiteGenerated, "platform-spec-catalog.json");
const docsDir = path.join(websiteGenerated, "platform-spec-docs");

interface CatalogEntry {
	slug: string;
	repoPath: string;
	specLevel: string;
	pathClass: string;
	title: string;
	status: string | null;
	contentPath: string;
}

interface CatalogFile {
	generatedAt: string;
	entries: CatalogEntry[];
}

interface DocBundle {
	slug: string;
	repoPath: string;
	frontmatter: Record<string, unknown>;
	body: string;
	layoutJson?: Record<string, unknown>;
	generatedAt: string;
}

function contentPathToFile(contentPath: string): string {
	const fileName = path.basename(contentPath);
	return path.join(docsDir, fileName);
}

function hashContent(body: string, frontmatterJson: string): string {
	return createHash("sha256")
		.update(body)
		.update(frontmatterJson)
		.digest("hex");
}

async function upsertSpecDocument(
	entry: CatalogEntry,
	bundle: DocBundle,
): Promise<void> {
	const frontmatterJson = JSON.stringify(bundle.frontmatter ?? {});
	const layoutJson = bundle.layoutJson ? JSON.stringify(bundle.layoutJson) : null;
	const status =
		typeof bundle.frontmatter?.status === "string"
			? bundle.frontmatter.status
			: entry.status;
	const title =
		typeof bundle.frontmatter?.title === "string"
			? bundle.frontmatter.title
			: entry.title;
	const now = new Date().toISOString();

	await runWrite(
		`
		MERGE (d:SpecDocument { slug: $slug })
		SET d.repoPath = $repoPath,
		    d.title = $title,
		    d.specLevel = $specLevel,
		    d.pathClass = $pathClass,
		    d.status = $status,
		    d.frontmatterJson = $frontmatterJson,
		    d.bodyMd = $bodyMd,
		    d.layoutJson = $layoutJson,
		    d.contentHash = $contentHash,
		    d.importedAt = $importedAt,
		    d.updatedAt = $updatedAt
		`,
		{
			slug: entry.slug,
			repoPath: bundle.repoPath ?? entry.repoPath,
			title,
			specLevel: entry.specLevel,
			pathClass: entry.pathClass,
			status,
			frontmatterJson,
			bodyMd: bundle.body ?? "",
			layoutJson,
			contentHash: hashContent(bundle.body ?? "", frontmatterJson),
			importedAt: bundle.generatedAt ?? now,
			updatedAt: now,
		},
	);
}

async function main(): Promise<void> {
	if (!fs.existsSync(catalogPath)) {
		console.error(`import-mdx: missing catalog at ${catalogPath}`);
		console.error("Run site/website prebuild first (generate:platform-spec-catalog).");
		process.exit(1);
	}

	const catalog = JSON.parse(
		fs.readFileSync(catalogPath, "utf8"),
	) as CatalogFile;

	await ensureMemgraphReady();

	let imported = 0;
	let skipped = 0;

	for (const entry of catalog.entries) {
		const docPath = contentPathToFile(entry.contentPath);
		if (!fs.existsSync(docPath)) {
			skipped += 1;
			continue;
		}

		const bundle = JSON.parse(fs.readFileSync(docPath, "utf8")) as DocBundle;
		await upsertSpecDocument(entry, bundle);
		imported += 1;
	}

	console.log(
		`import-mdx: ok (${imported} documents imported, ${skipped} skipped, catalog ${catalog.generatedAt})`,
	);
}

try {
	await main();
} finally {
	await closeMemgraph();
}

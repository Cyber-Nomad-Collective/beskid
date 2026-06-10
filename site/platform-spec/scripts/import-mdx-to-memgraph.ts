#!/usr/bin/env bun
/**
 * One-time / idempotent import of normative MDX into Memgraph SpecDocument nodes.
 *
 * Usage:
 *   MEMGRAPH_URI=bolt://127.0.0.1:7687 bun run scripts/import-mdx-to-memgraph.ts
 *
 * Optional env:
 *   PLATFORM_SPEC_CONTENT_ROOT — override MDX tree root
 *   BESKID_WEBSITE_ROOT — website root (content inferred under src/content/docs/platform-spec)
 *   SOURCE_GIT_SHA — provenance override (defaults to `git rev-parse HEAD` in repo root)
 */
import {
	closeMemgraph,
	ensureMemgraphReady,
} from "../src/server/memgraph/client.ts";
import { importMdxToMemgraph } from "../src/server/memgraph/import-mdx.ts";

async function main(): Promise<void> {
	process.env.SKIP_ENV_VALIDATION = "1";
	await ensureMemgraphReady();
	const result = await importMdxToMemgraph({
		sourceGitSha: process.env.SOURCE_GIT_SHA?.trim() || null,
	});

	console.log("import-mdx-to-memgraph: OK");
	console.log(`  content root: ${result.contentRoot}`);
	console.log(`  documents: ${result.documentCount}`);
	console.log(`  CONTAINS edges: ${result.containsEdgeCount}`);
	console.log(`  RELATED_TO edges: ${result.relatedEdgeCount}`);
	console.log(`  sourceGitSha: ${result.sourceGitSha ?? "(unknown)"}`);
}

main()
	.catch((error: unknown) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`import-mdx-to-memgraph: failed — ${message}`);
		process.exitCode = 1;
	})
	.finally(async () => {
		await closeMemgraph();
	});

#!/usr/bin/env bun
// Native-shape spec seeder.
//
// Treats OpenSpec as the source of truth and projects it into the platform-spec
// runtime stores. Three cooperating stages, selectable by flag:
//
//   --static   Statically generate the JSON seed workspace (seed/*.json) from
//              openspec/. Baked into the image at build time.
//   --stores   Upsert the seed workspace into the SQLite settings database.
//   --graph    Upsert the domain -> area -> feature graph into Memgraph (MERGE).
//
// With no stage flag it runs --static + --stores, and adds --graph when a
// MEMGRAPH_URI is configured. Every store write is an idempotent upsert, so this
// is safe to run on every container start.
//
//   --out <dir>      Override the seed output directory.
//   --check-layouts  Fail if any capability violates its enforceable layout.
//   --strict         Treat layout violations as errors in --static too.
//   --prune-graph    Delete SpecDocument nodes absent from the current revision.

import { mkdirSync } from "node:fs";

import { Database } from "bun:sqlite";

import {
	resolvePlatformSpecDataDir,
	resolveSeedDir,
	settingsDbPathIn,
} from "#/lib/spec/paths.core";
import { seedSpecGraph } from "#/lib/spec/graph-seed";
import {
	buildSeedWorkspace,
	generateSeed,
	loadSeed,
	type SeedWorkspace,
} from "#/lib/spec/static";
import { seedSpecStore } from "#/lib/storage/spec-store";

interface Options {
	static: boolean;
	stores: boolean;
	graph: boolean;
	checkLayouts: boolean;
	strict: boolean;
	pruneGraph: boolean;
	outDir: string;
}

function parseArgs(argv: string[]): Options {
	const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
	const outIndex = argv.indexOf("--out");
	const outDir =
		outIndex >= 0 && argv[outIndex + 1] ? argv[outIndex + 1]! : resolveSeedDir();

	const explicitStage =
		flags.has("--static") || flags.has("--stores") || flags.has("--graph");
	const graphConfigured = Boolean(process.env.MEMGRAPH_URI?.trim());

	return {
		static: flags.has("--static") || !explicitStage,
		stores: flags.has("--stores") || !explicitStage,
		graph: flags.has("--graph") || (!explicitStage && graphConfigured),
		checkLayouts: flags.has("--check-layouts"),
		strict: flags.has("--strict"),
		pruneGraph: flags.has("--prune-graph"),
		outDir,
	};
}

function reportLayout(workspace: SeedWorkspace): void {
	const { checked, conforming, violations } = workspace.meta.layout;
	console.log(
		`  layout: ${conforming}/${checked} conforming, ${violations} violation(s)`,
	);
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));

	if (options.checkLayouts) {
		const { workspace, findings } = buildSeedWorkspace();
		reportLayout(workspace);
		if (findings.length > 0) {
			for (const finding of findings) {
				console.error(`✗ ${finding.capability}`);
				for (const violation of finding.violations) {
					console.error(`    - ${violation.message}`);
				}
			}
			process.exit(1);
		}
		console.log("Layout check OK.");
		return;
	}

	let workspace: SeedWorkspace | null = null;
	let findings: ReturnType<typeof generateSeed>["findings"] = [];

	if (options.static) {
		const result = generateSeed({ outDir: options.outDir });
		workspace = result.workspace;
		findings = result.findings;
		const { counts } = workspace.meta;
		console.log(
			`Static seed written to ${result.outDir}: ${counts.capabilities} capabilities, ` +
				`${counts.domains} domains, ${counts.areas} areas, ${counts.requirements} requirements ` +
				`(revision ${workspace.meta.revision.slice(0, 12)}).`,
		);
		reportLayout(workspace);
		if (options.strict && findings.length > 0) {
			console.error(`Layout violations: ${findings.length}. Failing (--strict).`);
			process.exit(1);
		}
	}

	if (options.stores || options.graph) {
		workspace = workspace ?? loadSeed(options.outDir) ?? buildSeedWorkspace().workspace;
	}

	if (options.stores && workspace) {
		const dataDir = resolvePlatformSpecDataDir();
		mkdirSync(dataDir, { recursive: true });
		const db = new Database(settingsDbPathIn(dataDir), { create: true });
		try {
			const result = seedSpecStore(db, workspace);
			console.log(
				`SQLite seed upserted: ${result.capabilities} capabilities, ${result.layouts} layouts, ` +
					`${result.prunedCapabilities} pruned (revision ${result.revision.slice(0, 12)}).`,
			);
		} finally {
			db.close();
		}
	}

	if (options.graph && workspace) {
		const uri = process.env.MEMGRAPH_URI?.trim();
		if (!uri) {
			console.error("--graph requested but MEMGRAPH_URI is not set; skipping graph seed.");
		} else {
			try {
				const result = await seedSpecGraph(uri, workspace, {
					prune: options.pruneGraph,
				});
				console.log(
					`Memgraph seed upserted: ${result.nodes} spec nodes, ${result.pruned} pruned.`,
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`Memgraph seed failed (non-fatal): ${message}`);
			}
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

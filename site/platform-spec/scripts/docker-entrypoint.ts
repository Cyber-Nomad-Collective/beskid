#!/usr/bin/env bun
/**
 * Container entrypoint: import normative JSON workspace to Memgraph, start app.
 * When `site/spec-content` is absent, optionally seed from bundled MDX source.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { seedWorkspace } from "../../../beskid_web_common/packages/spec-core/src/seed-workspace.ts";
import { importJsonWorkspace } from "../src/server/memgraph/import-json.ts";

const appRoot = path.resolve(import.meta.dirname, "..");
const normativeDir =
	process.env.SPEC_WORKSPACE_DIR?.trim() ||
	path.join(appRoot, "../../spec-content");
const mdxSource =
	process.env.PLATFORM_SPEC_SEED_FROM?.trim() ||
	path.join(appRoot, "seed-source/platform-spec");

function resolveWorkspaceDir(): string {
	if (fs.existsSync(path.join(normativeDir, "spec.json"))) {
		return path.resolve(normativeDir);
	}
	const legacySeed = path.join(appRoot, "seed");
	if (fs.existsSync(path.join(legacySeed, "spec.json"))) {
		return legacySeed;
	}
	return path.resolve(normativeDir);
}

async function ensureWorkspace(): Promise<string> {
	const workspaceDir = resolveWorkspaceDir();
	if (fs.existsSync(path.join(workspaceDir, "spec.json"))) {
		console.log(`docker-entrypoint: using workspace ${workspaceDir}`);
		return workspaceDir;
	}

	if (!fs.existsSync(mdxSource)) {
		throw new Error(
			`No normative workspace at ${workspaceDir} and no MDX seed source at ${mdxSource}`,
		);
	}

	fs.mkdirSync(workspaceDir, { recursive: true });
	const result = seedWorkspace({
		workspaceDir,
		mdxRoot: mdxSource,
		force: true,
	});
	if (result.errors.length > 0 || !result.validationOk) {
		throw new Error(`seed failed: ${result.errors.join("; ")}`);
	}
	console.log(`docker-entrypoint: seeded workspace at ${workspaceDir}`);
	return workspaceDir;
}

async function importToMemgraph(workspaceDir: string): Promise<void> {
	if (!process.env.MEMGRAPH_URI?.trim()) {
		console.log("docker-entrypoint: MEMGRAPH_URI unset, skipping Memgraph import");
		return;
	}

	process.env.SKIP_ENV_VALIDATION = "1";
	const { ensureMemgraphReady, closeMemgraph } = await import(
		"../src/server/memgraph/client.ts"
	);

	await ensureMemgraphReady();
	const result = await importJsonWorkspace({ workspaceDir });
	console.log(
		`docker-entrypoint: imported ${result.documentCount} documents to Memgraph`,
	);
	await closeMemgraph();
}

function startServer(): void {
	const child = spawn("bun", ["run", ".output/server/index.mjs"], {
		cwd: appRoot,
		stdio: "inherit",
		env: process.env,
	});
	child.on("exit", (code) => process.exit(code ?? 1));
}

try {
	const workspaceDir = await ensureWorkspace();
	await importToMemgraph(workspaceDir);
	startServer();
} catch (error) {
	console.error(
		`docker-entrypoint: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exit(1);
}

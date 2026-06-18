#!/usr/bin/env bun
/**
 * Validate or refresh local dev workspace under site/spec-content.
 * Legacy MDX import is optional via PLATFORM_SPEC_SEED_FROM.
 */
import fs from "node:fs";
import path from "node:path";
import { validateWorkspace } from "../../../beskid_web_common/packages/spec-core/src/validate-workspace.ts";
import { seedWorkspace } from "../../../beskid_web_common/packages/spec-core/src/seed-workspace.ts";

const workspaceDir = path.resolve(import.meta.dirname, "../../spec-content");
/**
 * Normative content source is site/spec-content (the canonical submodule).
 * Legacy MDX import from site/website is no longer the default — the website
 * platform-spec rendering is retired. Set PLATFORM_SPEC_SEED_FROM only for
 * one-off legacy migrations.
 */
const mdxRoot = process.env.PLATFORM_SPEC_SEED_FROM?.trim() || workspaceDir;
const force = process.argv.includes("--force");

if (!fs.existsSync(path.join(workspaceDir, "spec.json"))) {
	console.error(
		`Missing ${workspaceDir}/spec.json — run: git submodule update --init site/spec-content`,
	);
	process.exit(1);
}

if (force && fs.existsSync(mdxRoot)) {
	const result = seedWorkspace({ workspaceDir, mdxRoot, force: true });
	console.log(
		`Seeded ${workspaceDir}: imported ${result.imported}, skipped ${result.skipped}`,
	);
	for (const err of result.errors) console.error(err);
	if (result.errors.length > 0 || !result.validationOk) process.exit(1);
}

const report = validateWorkspace(workspaceDir);
for (const issue of report.issues) {
	console.log(`[${issue.severity}] ${issue.path}: ${issue.message}`);
}
console.log(`Nodes: ${report.nodeCount}, issues: ${report.issues.length}`);
process.exit(report.ok ? 0 : 1);

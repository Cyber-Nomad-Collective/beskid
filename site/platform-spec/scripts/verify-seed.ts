#!/usr/bin/env bun
// Verifies the baked static seed workspace is present, complete, and matches the
// current OpenSpec revision, and that every capability conforms to its
// enforceable layout. Run after `bun run seed:static` in CI and the image build.

import { buildSeedWorkspace, loadSeed } from "#/lib/spec/static";
import { resolveSeedDir } from "#/lib/spec/paths.core";

function fail(message: string): never {
	console.error(`seed verification FAILED: ${message}`);
	process.exit(1);
}

const seedDir = resolveSeedDir();
const seed = loadSeed(seedDir);
if (!seed) {
	fail(`no seed workspace found in ${seedDir}. Run \`bun run seed:static\`.`);
}

const { workspace: live } = buildSeedWorkspace();

if (seed.meta.revision !== live.meta.revision) {
	fail(
		`seed revision ${seed.meta.revision.slice(0, 12)} is stale; OpenSpec is at ` +
			`${live.meta.revision.slice(0, 12)}. Re-run \`bun run seed:static\`.`,
	);
}

if (seed.meta.counts.capabilities !== live.meta.counts.capabilities) {
	fail(
		`seed has ${seed.meta.counts.capabilities} capabilities but OpenSpec has ` +
			`${live.meta.counts.capabilities}.`,
	);
}

const missingDocs = live.catalog.entries.filter(
	(entry) => !seed.documents[entry.slug],
);
if (missingDocs.length > 0) {
	fail(`seed is missing ${missingDocs.length} document bundle(s).`);
}

if (seed.meta.layout.violations > 0) {
	fail(
		`${seed.meta.layout.violations} capability layout violation(s) in the seed.`,
	);
}

console.log(
	`seed verification OK: ${seed.meta.counts.capabilities} capabilities, ` +
		`${seed.meta.counts.domains} domains, ${seed.meta.counts.areas} areas, ` +
		`revision ${seed.meta.revision.slice(0, 12)}.`,
);

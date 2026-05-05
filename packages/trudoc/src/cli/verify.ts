#!/usr/bin/env node
/**
 * trudoc verify — orchestrates Beskid docs contract checks.
 *
 * Site root: defaults to `process.cwd()` when run from `site/website`, or pass `--site-root <path>`
 * (sets `BESKID_WEBSITE_ROOT` for spawned `.mjs` validators). Env `BESKID_WEBSITE_ROOT` alone also works if cwd is wrong.
 *
 * Presets:
 * - `ci` — PR gate (frontmatter + layout), matches former `verify:platform-spec-ci`.
 * - `beskid-prebuild` — full prebuild doc gates (no `sync:cli-version` / no git-meta generate).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTrudocWebsiteRoot } from './site-root';
import { stepsForPreset, type VerifyPreset } from '../verify/presets';
import { runVerifyStep } from '../verify/run';
import { resolveTsxCli } from '../verify/tsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..', '..');
const layoutVerifyTs = path.join(__dirname, 'layout-verify.ts');

function parsePreset(argv: string[]): VerifyPreset {
	const i = argv.indexOf('--preset');
	if (i >= 0 && argv[i + 1] === 'beskid-prebuild') return 'beskid-prebuild';
	const j = argv.find((a) => a.startsWith('--preset='));
	if (j?.slice('--preset='.length) === 'beskid-prebuild') return 'beskid-prebuild';
	return 'ci';
}

const siteRoot = resolveTrudocWebsiteRoot(process.argv, import.meta.url);
const preset = parsePreset(process.argv);
const tsxCli = resolveTsxCli(pkgRoot);
const steps = stepsForPreset(preset, { pkgRoot, layoutVerifyTs, tsxCli });

for (const step of steps) {
	runVerifyStep(step, siteRoot);
}

console.log(`\ntrudoc verify — preset "${preset}" passed.`);

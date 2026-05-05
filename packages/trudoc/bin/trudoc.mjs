#!/usr/bin/env node
/**
 * Published CLI entry: runs `src/cli/verify.ts` via local `tsx`.
 * Pass `--site-root <path>` and `--preset ci|beskid-prebuild` like direct `tsx` invocation.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function resolveTsxCli(startDir) {
	let dir = startDir;
	for (let i = 0; i < 8; i++) {
		const candidate = path.join(dir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
		if (fs.existsSync(candidate)) return candidate;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error('trudoc: could not find tsx (install devDependency `tsx` near this package or at the workspace root).');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.dirname(here);

let tsxCli;
try {
	tsxCli = resolveTsxCli(pkgRoot);
} catch (e) {
	console.error(String(e));
	process.exit(1);
}

const verifyTs = path.join(pkgRoot, 'src', 'cli', 'verify.ts');
if (!fs.existsSync(verifyTs)) {
	console.error(`trudoc: missing ${verifyTs}`);
	process.exit(1);
}

const r = spawnSync(process.execPath, [tsxCli, verifyTs, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);

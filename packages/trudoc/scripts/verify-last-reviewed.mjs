#!/usr/bin/env node
/**
 * @deprecated Implementation lives in `src/cli/last-reviewed-verify.ts`; this shim preserves the old script path.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getWebsiteRoot } from './lib/website-root.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = getWebsiteRoot(import.meta.url);
const entry = path.join(scriptDir, '..', 'src', 'cli', 'last-reviewed-verify.ts');

const r = spawnSync('npx', ['tsx', entry, ...process.argv.slice(2)], {
	stdio: 'inherit',
	cwd: websiteRoot,
	shell: false,
});
if (r.error) throw r.error;
if (r.status !== 0) process.exit(r.status ?? 1);

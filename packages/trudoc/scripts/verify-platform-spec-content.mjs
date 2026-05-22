#!/usr/bin/env node
/**
 * Platform-spec content quality — see `src/verify/platform-spec-content.ts` for modes.
 * CI / prebuild: `--warn-only`. Local gate: strict (default).
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'verify', 'platform-spec-content.ts');
const args = ['tsx', script, ...process.argv.slice(2)];
const result = spawnSync('npx', args, { stdio: 'inherit', cwd: WEBSITE_ROOT, shell: false });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

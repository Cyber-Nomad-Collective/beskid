#!/usr/bin/env node
/**
 * PR-blocking platform-spec contracts (thin wrapper around `trudoc verify --preset ci`).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getWebsiteRoot } from './lib/website-root.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = getWebsiteRoot(import.meta.url);
const trudocVerify = path.join(scriptDir, '..', 'src', 'cli', 'verify.ts');

const r = spawnSync('npx', ['tsx', trudocVerify, '--preset', 'ci'], { stdio: 'inherit', cwd: websiteRoot, shell: false });
if (r.error) throw r.error;
if (r.status !== 0) process.exit(r.status ?? 1);
console.log('\nverify:platform-spec-ci — all checks passed.');

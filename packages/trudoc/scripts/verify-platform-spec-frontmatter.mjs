/**
 * Ensures platform-spec frontmatter contracts by delegating to shared Zod schemas in trudoc.
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'verify', 'platform-spec-frontmatter.ts');
const result = spawnSync('npx', ['tsx', script], {
	stdio: 'inherit',
	cwd: WEBSITE_ROOT,
	shell: false,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

/**
 * site/website prebuild: generators + layout guards + optional trudoc CI verify.
 * Set BESKID_SKIP_TRUDOC_VERIFY=1 in container builds (no .git / skip heavy gates).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '../../../site/website');

function run(label, args) {
	const r = spawnSync('bun', ['run', ...args], {
		cwd: websiteRoot,
		stdio: 'inherit',
		env: process.env,
	});
	if (r.status !== 0) {
		process.exit(r.status ?? 1);
	}
}

const devMode = process.argv.includes('--dev');
const skipTrudoc =
	devMode ||
	process.env.BESKID_SKIP_TRUDOC_VERIFY === '1' ||
	process.env.BESKID_SKIP_TRUDOC_VERIFY === 'true';

run('sync:cli-version', ['sync:cli-version']);
run('generate:platform-spec-git-meta', ['generate:platform-spec-git-meta']);
run('generate:platform-spec-nav-tree', ['generate:platform-spec-nav-tree']);
run('generate:platform-spec-catalog', ['generate:platform-spec-catalog']);
run('generate:book-nav-tree', ['generate:book-nav-tree']);
run('verify:book-images', ['verify:book-images']);
run('verify:book-layout', ['verify:book-layout']);
run('verify:platform-spec-home-layout', ['verify:platform-spec-home-layout']);

if (skipTrudoc) {
	console.warn('website-prebuild: BESKID_SKIP_TRUDOC_VERIFY set — skipping verify:trudoc (run in CI on main).');
} else {
	run('verify:trudoc', ['verify:trudoc', '--', '--preset', 'ci']);
}

console.log('website-prebuild: OK');

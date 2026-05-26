/**
 * Resolve trudoc scripts across workspace symlink, hoisted install, submodule, or legacy paths.
 * Usage: node scripts/run-trudoc.mjs <script-name-under-scripts/> [-- extra args]
 * Example: node scripts/run-trudoc.mjs website-prebuild.mjs -- --dev
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function resolveTrudocRoot() {
	const require = createRequire(join(websiteRoot, 'package.json'));
	for (const id of ['trudoc/package.json', '@cyber-nomad-collective/trudoc/package.json']) {
		try {
			return dirname(require.resolve(id));
		} catch {
			/* try next */
		}
	}
	for (const candidate of [
		join(websiteRoot, '../../beskid_web_common/packages/trudoc'),
		join(websiteRoot, '../../packages/trudoc'),
	]) {
		if (existsSync(join(candidate, 'package.json'))) {
			return candidate;
		}
	}
	console.error(
		'trudoc not found. From repo root: git submodule update --init beskid_web_common && bun install --frozen-lockfile',
	);
	process.exit(1);
}

const scriptArg = process.argv[2];
if (!scriptArg) {
	console.error('usage: node scripts/run-trudoc.mjs <scripts/...> [-- args]');
	process.exit(1);
}

let extraArgs = process.argv.slice(3);
if (extraArgs[0] === '--') {
	extraArgs = extraArgs.slice(1);
}

const trudocRoot = resolveTrudocRoot();
const scriptPath =
	scriptArg.startsWith('scripts/') || scriptArg.startsWith('bin/')
		? join(trudocRoot, scriptArg)
		: join(trudocRoot, 'scripts', scriptArg);

if (!existsSync(scriptPath)) {
	console.error(`trudoc script not found: ${scriptPath}`);
	process.exit(1);
}

const useBun = scriptPath.endsWith('.ts');
const runner = useBun ? 'bun' : process.execPath;
const runnerArgs = useBun ? [scriptPath, ...extraArgs] : [scriptPath, ...extraArgs];

const result = spawnSync(runner, runnerArgs, {
	cwd: websiteRoot,
	stdio: 'inherit',
	env: process.env,
});
process.exit(result.status ?? 1);

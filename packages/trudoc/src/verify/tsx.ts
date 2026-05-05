import fs from 'node:fs';
import path from 'node:path';

/** Walk up from `startDir` to find `node_modules/tsx/dist/cli.mjs` (workspace hoisting). */
export function resolveTsxCli(startDir: string): string {
	let dir = startDir;
	for (let i = 0; i < 8; i++) {
		const candidate = path.join(dir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
		if (fs.existsSync(candidate)) return candidate;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error(
		'trudoc: could not find tsx (install devDependency `tsx` near this package or at the workspace root).',
	);
}

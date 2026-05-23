import fs from 'node:fs';
import path from 'node:path';

function bunHoistedTsxCli(startDir: string): string | null {
	let dir = startDir;
	for (let i = 0; i < 8; i++) {
		const bunRoot = path.join(dir, 'node_modules', '.bun');
		if (fs.existsSync(bunRoot)) {
			for (const name of fs.readdirSync(bunRoot)) {
				if (!name.startsWith('tsx@')) continue;
				const candidate = path.join(bunRoot, name, 'node_modules', 'tsx', 'dist', 'cli.mjs');
				if (fs.existsSync(candidate)) return candidate;
			}
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

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
	const hoisted = bunHoistedTsxCli(startDir);
	if (hoisted) return hoisted;
	throw new Error(
		'trudoc: could not find tsx (install devDependency `tsx` near this package or at the workspace root).',
	);
}

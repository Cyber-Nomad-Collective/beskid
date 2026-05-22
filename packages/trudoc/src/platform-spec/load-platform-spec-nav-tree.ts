import fs from 'node:fs';
import path from 'node:path';
import type { NavTreeNode } from './nav-tree';

export type PlatformSpecNavTreeFile = {
	generatedAt: string;
	tree: NavTreeNode;
};

export function readPlatformSpecNavTreeOrThrow(cwd: string): PlatformSpecNavTreeFile {
	const p = path.join(cwd, 'src', 'generated', 'platform-spec-nav-tree.json');
	if (!fs.existsSync(p)) {
		throw new Error(
			`Missing ${path.relative(cwd, p)}. Run: bun run generate:platform-spec-nav-tree (from site/website).`,
		);
	}
	return JSON.parse(fs.readFileSync(p, 'utf8')) as PlatformSpecNavTreeFile;
}

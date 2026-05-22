import fs from 'node:fs';
import path from 'node:path';
import type { BookNavTreeNode, BookNavLink, BookPrevNext } from './nav-tree';

export type BookNavTreeFile = {
	generatedAt: string;
	tree: BookNavTreeNode;
	tutorialSequence: BookNavLink[];
	prevNextBySlug: Record<string, BookPrevNext>;
};

export function readBookNavTreeOrThrow(cwd: string): BookNavTreeFile {
	const p = path.join(cwd, 'src', 'generated', 'book-nav-tree.json');
	if (!fs.existsSync(p)) {
		throw new Error(
			`Missing ${path.relative(cwd, p)}. Run: bun run generate:book-nav-tree (from site/website).`,
		);
	}
	return JSON.parse(fs.readFileSync(p, 'utf8')) as BookNavTreeFile;
}

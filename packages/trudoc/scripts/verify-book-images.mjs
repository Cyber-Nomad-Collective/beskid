/**
 * Fail fast when book markdown references a missing local image path.
 * Prevents Astro dev/build from entering an unrecoverable ImageNotFound state.
 */
import fs from 'node:fs';
import path from 'node:path';

import { getWebsiteRoot } from './lib/website-root.mjs';

const IMAGE_RE = /!\[[^\]]*]\(([^)]+)\)/g;
const SKIP_BASENAMES = new Set(['AGENTS.md', 'CLAUDE.md', 'GEMINI.md']);

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, name.name);
		if (name.isDirectory()) walk(full, out);
		else if (/\.(md|mdx)$/i.test(name.name) && !SKIP_BASENAMES.has(name.name)) out.push(full);
	}
	return out;
}

function stripNonProse(text) {
	return text
		.replace(/```[\s\S]*?```/g, '')
		.replace(/`[^`\n]+`/g, '');
}

function isExternalOrPublic(src) {
	const t = src.trim();
	if (/^https?:\/\//i.test(t)) return true;
	if (t.startsWith('/')) return true;
	return false;
}

function resolveImagePath(mdFile, src) {
	const t = src.trim();
	if (isExternalOrPublic(t)) return null;
	const rel = t.replace(/^\.\//, '');
	return path.resolve(path.dirname(mdFile), rel);
}

function main() {
	const websiteRoot = getWebsiteRoot(import.meta.url);
	const bookRoot = path.join(websiteRoot, 'src', 'content', 'docs', 'book');
	const files = walk(bookRoot);
	const errors = [];

	for (const file of files) {
		const text = stripNonProse(fs.readFileSync(file, 'utf8'));
		let match;
		IMAGE_RE.lastIndex = 0;
		while ((match = IMAGE_RE.exec(text)) !== null) {
			const src = match[1];
			if (!src || isExternalOrPublic(src)) continue;
			const resolved = resolveImagePath(file, src);
			if (resolved && fs.existsSync(resolved)) continue;
			const rel = path.relative(websiteRoot, file).split(path.sep).join('/');
			errors.push(`${rel}: missing local image "${src}" (use https:// remote URL or add the co-located file)`);
		}
	}

	if (errors.length) {
		console.error('verify-book-images failed:\n');
		for (const e of errors) console.error(`  - ${e}`);
		console.error(
			'\nCo-located images in content/docs can brick `astro dev` until you rm -rf .astro dist.',
		);
		console.error('Run: cd site/website && bun run dev:clean');
		console.error(
			'Do not rewrite book ![...](...) refs to fix this — add the missing asset or ask the author (see AGENTS.md).',
		);
		process.exit(1);
	}

	console.log(`verify-book-images: OK (${files.length} book file(s) checked).`);
}

main();

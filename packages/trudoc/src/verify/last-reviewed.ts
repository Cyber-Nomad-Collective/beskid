import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

function walk(dir: string, out: string[] = []): string[] {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(entry.name)) out.push(p);
	}
	return out;
}

function frontmatter(filePath: string): Record<string, unknown> {
	const raw = fs.readFileSync(filePath, 'utf8');
	if (!raw.startsWith('---')) return {};
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return {};
	return (parseYaml(raw.slice(3, end).trim()) as Record<string, unknown>) ?? {};
}

/**
 * Warning-only: Standard feature pages with `relatedTopics` should declare `lastReviewed`.
 */
export function runLastReviewedVerify(websiteRoot: string): void {
	const root = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
	const files = walk(root);
	const misses: string[] = [];

	for (const file of files) {
		const fm = frontmatter(file);
		if (fm.specLevel !== 'feature' || fm.status !== 'Standard') continue;
		if (!Array.isArray(fm.relatedTopics) || fm.relatedTopics.length === 0) continue;
		const isString = typeof fm.lastReviewed === 'string' && fm.lastReviewed.trim() !== '';
		const isDate = fm.lastReviewed instanceof Date && !Number.isNaN(fm.lastReviewed.getTime());
		if (!isString && !isDate) {
			misses.push(path.relative(websiteRoot, file));
		}
	}

	if (misses.length) {
		console.warn(
			`verify:last-reviewed: ${misses.length} Standard-status feature file(s) missing lastReviewed (warning-only).`,
		);
		for (const m of misses) console.warn(`  - ${m}`);
	} else {
		console.log('verify:last-reviewed: all Standard feature pages with related topics have lastReviewed.');
	}
}

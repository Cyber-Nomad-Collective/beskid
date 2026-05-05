/**
 * One-shot: insert SpecArticleChrome import + component after frontmatter in platform-spec article MDX files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs', 'platform-spec');
const TARGET = 'SpecArticleChrome.astro';
const REPO_ROOT = path.join(WEBSITE_ROOT, '..', '..');
const COMPONENT_CANDIDATES = [
	path.join(REPO_ROOT, 'packages', 'beskid-docs-ui', 'src', 'platform-spec', TARGET),
	path.join(WEBSITE_ROOT, 'src', 'components', 'platform-spec', TARGET),
];
const COMPONENT_ABS = COMPONENT_CANDIDATES.find((p) => fs.existsSync(p)) ?? COMPONENT_CANDIDATES[1];

function walk(dir, out = []) {
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (name.name.endsWith('.mdx')) out.push(p);
	}
	return out;
}

function frontmatterEndIndex(raw) {
	const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
	return m ? m[0].length : null;
}

function relImport(fromFile, toAbs) {
	const fromDir = path.dirname(fromFile);
	let rel = path.relative(fromDir, toAbs).split(path.sep).join('/');
	if (!rel.startsWith('.')) rel = `./${rel}`;
	return rel;
}

let updated = 0;
for (const file of walk(ROOT)) {
	const raw = fs.readFileSync(file, 'utf8');
	const endIdx = frontmatterEndIndex(raw);
	if (endIdx == null) continue;
	const yaml = raw.slice(3, raw.indexOf('\n---', 3));
	let data;
	try {
		data = parseYaml(yaml) ?? {};
	} catch {
		continue;
	}
	if (data.specLevel !== 'article') continue;
	if (raw.includes('SpecArticleChrome')) continue;

	const importLine = `import SpecArticleChrome from '${relImport(file, COMPONENT_ABS)}';`;
	const inject = `\n${importLine}\n\n<SpecArticleChrome />\n\n`;
	const next = raw.slice(0, endIdx) + inject + raw.slice(endIdx);
	fs.writeFileSync(file, next, 'utf8');
	updated += 1;
	console.log('updated', path.relative(WEBSITE_ROOT, file));
}
console.log(`inject-spec-article-chrome: updated ${updated} file(s).`);

/**
 * Build nested platform-spec navigation tree for docs UI (rail / drawer).
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getWebsiteRoot } from './lib/website-root.mjs';
import { classifyPlatformSpecRel } from '../src/layout/scan.ts';
import {
	buildNavTree,
	pathClassToNavLevel,
	shouldSkipPlatformSpecRel,
	slugToHref,
} from '../src/platform-spec/nav-tree.ts';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const DOCS_ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs');
const SPEC_ROOT = path.join(DOCS_ROOT, 'platform-spec');
const OUT_DIR = path.join(WEBSITE_ROOT, 'src', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'platform-spec-nav-tree.json');
/** Static URL for external consumers (roadmap, tooling): /generated/platform-spec-nav-tree.json */
const PUBLIC_OUT_FILE = path.join(
	WEBSITE_ROOT,
	'public',
	'generated',
	'platform-spec-nav-tree.json',
);

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

function frontmatterEndIndex(raw) {
	const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
	return m ? m[0].length : null;
}

function parseFrontmatter(raw) {
	const endIdx = frontmatterEndIndex(raw);
	if (endIdx == null) return {};
	const yaml = raw.slice(3, raw.indexOf('\n---', 3));
	try {
		return parseYaml(yaml) ?? {};
	} catch {
		return {};
	}
}

function filePathToDocSlug(absFile) {
	const rel = path.relative(DOCS_ROOT, absFile).split(path.sep).join('/');
	return rel.replace(/\.(md|mdx)$/i, '').replace(/\/index$/, '');
}

const rows = [];

for (const abs of walk(SPEC_ROOT)) {
	const relFromDocs = path.relative(DOCS_ROOT, abs).split(path.sep).join('/');
	if (!relFromDocs.startsWith('platform-spec/')) continue;

	const relUnderSpec = relFromDocs.slice('platform-spec/'.length);
	if (shouldSkipPlatformSpecRel(relUnderSpec)) continue;

	const cls = classifyPlatformSpecRel(relUnderSpec);
	if (cls === 'legacy-or-bridge' || cls === 'component') continue;

	const level = pathClassToNavLevel(cls);
	if (!level) continue;

	const slug = filePathToDocSlug(abs);
	const data = parseFrontmatter(fs.readFileSync(abs, 'utf8'));
	const lastSeg = slug.split('/').filter(Boolean).at(-1) ?? slug;
	const title =
		typeof data.title === 'string' && data.title.trim() !== '' ? data.title.trim() : lastSeg;

	rows.push({
		slug,
		title,
		level,
		href: slugToHref(slug),
	});
}

const tree = buildNavTree(rows);
const payload = {
	generatedAt: new Date().toISOString(),
	tree,
};

const json = `${JSON.stringify(payload, null, 2)}\n`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, json, 'utf8');
console.log(`Wrote ${path.relative(WEBSITE_ROOT, OUT_FILE)} (${rows.length} nodes).`);

fs.mkdirSync(path.dirname(PUBLIC_OUT_FILE), { recursive: true });
fs.writeFileSync(PUBLIC_OUT_FILE, json, 'utf8');
console.log(`Wrote ${path.relative(WEBSITE_ROOT, PUBLIC_OUT_FILE)} (public API).`);

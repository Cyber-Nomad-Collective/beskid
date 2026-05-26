/**
 * Build platform-spec catalog index + per-document JSON bundles for external consumers (tracker).
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getWebsiteRoot } from './lib/website-root.mjs';
import { classifyPlatformSpecRel } from '../src/layout/scan.ts';
import {
	catalogDocContentPath,
	encodeCatalogDocSlug,
	parentSlugForCatalog,
} from '../src/platform-spec/catalog.ts';
import { shouldSkipPlatformSpecRel, slugToHref } from '../src/platform-spec/nav-tree.ts';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const DOCS_ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs');
const SPEC_ROOT = path.join(DOCS_ROOT, 'platform-spec');
const OUT_DIR = path.join(WEBSITE_ROOT, 'src', 'generated');
const CATALOG_FILE = path.join(OUT_DIR, 'platform-spec-catalog.json');
const PUBLIC_CATALOG = path.join(
	WEBSITE_ROOT,
	'public',
	'generated',
	'platform-spec-catalog.json',
);
const DOCS_OUT_DIR = path.join(OUT_DIR, 'platform-spec-docs');
const PUBLIC_DOCS_DIR = path.join(WEBSITE_ROOT, 'public', 'generated', 'platform-spec-docs');

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
	if (endIdx == null) return { fm: {}, body: raw };
	const yaml = raw.slice(3, raw.indexOf('\n---', 3));
	let fm = {};
	try {
		fm = parseYaml(yaml) ?? {};
	} catch {
		fm = {};
	}
	return { fm, body: raw.slice(endIdx) };
}

function filePathToDocSlug(absFile) {
	const rel = path.relative(DOCS_ROOT, absFile).split(path.sep).join('/');
	return rel.replace(/\.(md|mdx)$/i, '').replace(/\/index$/, '');
}

function readLayoutJson(absFile) {
	const layoutPath = path.join(path.dirname(absFile), 'layout.json');
	if (!fs.existsSync(layoutPath)) return null;
	try {
		return JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
	} catch {
		return null;
	}
}

function specLevelFrom(fm, pathClass) {
	if (typeof fm.specLevel === 'string' && fm.specLevel.trim()) return fm.specLevel.trim();
	if (pathClass === 'adr') return 'adr';
	if (pathClass === 'domain-root' || pathClass === 'domain') return 'domain';
	if (pathClass === 'area') return 'area';
	if (pathClass === 'feature') return 'feature';
	if (pathClass === 'article') return 'article';
	return null;
}

const entries = [];
const generatedAt = new Date().toISOString();

fs.mkdirSync(DOCS_OUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });

for (const abs of walk(SPEC_ROOT)) {
	const relFromDocs = path.relative(DOCS_ROOT, abs).split(path.sep).join('/');
	if (!relFromDocs.startsWith('platform-spec/')) continue;

	const relUnderSpec = relFromDocs.slice('platform-spec/'.length);
	if (shouldSkipPlatformSpecRel(relUnderSpec)) continue;

	const pathClass = classifyPlatformSpecRel(relUnderSpec);
	if (pathClass === 'legacy-or-bridge' || pathClass === 'component') continue;

	const slug = filePathToDocSlug(abs);
	const raw = fs.readFileSync(abs, 'utf8');
	const { fm, body } = parseFrontmatter(raw);
	const lastSeg = slug.split('/').filter(Boolean).at(-1) ?? slug;
	const title =
		typeof fm.title === 'string' && fm.title.trim() !== '' ? fm.title.trim() : lastSeg;
	const description =
		typeof fm.description === 'string' && fm.description.trim() !== ''
			? fm.description.trim()
			: null;
	const specLevel = specLevelFrom(fm, pathClass);
	const repoPath = path
		.relative(WEBSITE_ROOT, abs)
		.split(path.sep)
		.join('/');
	const layoutJson = readLayoutJson(abs);
	const contentPath = catalogDocContentPath(slug);

	entries.push({
		slug,
		href: slugToHref(slug),
		pathClass,
		specLevel,
		title,
		description,
		status: typeof fm.status === 'string' ? fm.status : null,
		adrId: typeof fm.adrId === 'string' ? fm.adrId : null,
		adrStatus: typeof fm.adrStatus === 'string' ? fm.adrStatus : null,
		repoPath,
		contentPath,
		parentSlug: parentSlugForCatalog(slug, pathClass),
		hasLayoutJson: layoutJson != null,
	});

	const bundle = {
		generatedAt,
		slug,
		repoPath,
		frontmatter: fm,
		body,
		layoutJson,
	};
	const bundleName = `${encodeCatalogDocSlug(slug)}.json`;
	const bundleJson = `${JSON.stringify(bundle, null, 2)}\n`;
	fs.writeFileSync(path.join(DOCS_OUT_DIR, bundleName), bundleJson, 'utf8');
	fs.writeFileSync(path.join(PUBLIC_DOCS_DIR, bundleName), bundleJson, 'utf8');
}

entries.sort((a, b) => a.slug.localeCompare(b.slug));

const catalogPayload = {
	generatedAt,
	entries,
};

const catalogJson = `${JSON.stringify(catalogPayload, null, 2)}\n`;
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(PUBLIC_CATALOG), { recursive: true });
fs.writeFileSync(CATALOG_FILE, catalogJson, 'utf8');
fs.writeFileSync(PUBLIC_CATALOG, catalogJson, 'utf8');

console.log(
	`Wrote platform-spec catalog (${entries.length} entries) and ${entries.length} document bundles.`,
);

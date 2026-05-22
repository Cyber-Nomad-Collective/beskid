/**
 * Build nested book navigation tree for docs UI (rail / drawer) and chapter prev/next.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getWebsiteRoot } from './lib/website-root.mjs';
import {
	buildTutorialPrevNext,
	docFilePathToSlug,
	nestTutorialNavNodes,
	slugToHref,
} from '../src/book/nav-tree.ts';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const DOCS_ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs');
const BOOK_ROOT = path.join(DOCS_ROOT, 'book');
const MANIFEST_PATH = path.join(BOOK_ROOT, 'nav.order.json');
const OUT_DIR = path.join(WEBSITE_ROOT, 'src', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'book-nav-tree.json');

function parseFrontmatter(raw) {
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
	if (!m) return {};
	try {
		return parseYaml(m[1]) ?? {};
	} catch {
		return {};
	}
}

function titleForFile(absFile) {
	const data = parseFrontmatter(fs.readFileSync(absFile, 'utf8'));
	if (typeof data.title === 'string' && data.title.trim()) return data.title.trim();
	const rel = path.relative(DOCS_ROOT, absFile).split(path.sep).join('/');
	const slug = rel.replace(/\.(md|mdx)$/i, '').replace(/\/index$/, '');
	return slug.split('/').filter(Boolean).at(-1) ?? slug;
}

function filePathToSlug(absFile) {
	return docFilePathToSlug(absFile, DOCS_ROOT);
}

function nodeFromFile(absFile, part, extra = {}) {
	const slug = filePathToSlug(absFile);
	return {
		slug,
		href: slugToHref(slug),
		title: titleForFile(absFile),
		part,
		...extra,
	};
}

/** @param {string} dirAbs @param {string} slugPrefix e.g. book/reference */
function buildDirTree(dirAbs, slugPrefix, part) {
	if (!fs.existsSync(dirAbs)) return [];

	const entries = fs.readdirSync(dirAbs, { withFileTypes: true }).filter((e) => !e.name.startsWith('.'));
	const nodes = [];

	const indexFiles = entries.filter(
		(e) =>
			e.isFile() &&
			/^(index|README)\.(md|mdx)$/i.test(e.name),
	);
	const pageFiles = entries.filter(
		(e) => e.isFile() && /\.(md|mdx)$/i.test(e.name) && !/^(index|README)\./i.test(e.name),
	);
	const subdirs = entries.filter((e) => e.isDirectory());

	for (const sub of subdirs.sort((a, b) => a.name.localeCompare(b.name))) {
		const childAbs = path.join(dirAbs, sub.name);
		const childSlug = `${slugPrefix}/${sub.name}`;
		const children = buildDirTree(childAbs, childSlug, part);

		const indexAbs = ['index.md', 'index.mdx', 'README.md', 'readme.md'].map((n) => path.join(childAbs, n)).find((p) => fs.existsSync(p));
		if (indexAbs) {
			nodes.push({
				...nodeFromFile(indexAbs, part),
				children: children.length ? children : undefined,
			});
		} else if (children.length) {
			const firstLeaf = children.find((c) => c.href) ?? children[0];
			nodes.push({
				slug: childSlug,
				href: firstLeaf?.href ?? slugToHref(childSlug),
				title: sub.name.replace(/-/g, ' '),
				part,
				children,
			});
		}
	}

	for (const f of pageFiles.sort((a, b) => a.name.localeCompare(b.name))) {
		nodes.push(nodeFromFile(path.join(dirAbs, f.name), part));
	}

	if (indexFiles.length && !subdirs.length && !pageFiles.length) {
		nodes.push(nodeFromFile(path.join(dirAbs, indexFiles[0].name), part));
	}

	return nodes;
}

function nodeForSlug(slug, part) {
	const candidates = [
		path.join(DOCS_ROOT, `${slug}.md`),
		path.join(DOCS_ROOT, `${slug}.mdx`),
		path.join(DOCS_ROOT, slug, 'index.md'),
		path.join(DOCS_ROOT, slug, 'index.mdx'),
	];
	for (const c of candidates) {
		if (fs.existsSync(c)) {
			return nodeFromFile(c, part);
		}
	}
	const fallbackSlug = slug;
	return {
		slug: fallbackSlug,
		title: fallbackSlug.split('/').at(-1) ?? fallbackSlug,
		part,
	};
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const tutorialPart = manifest.tutorial.label;
const tutorialNodes = nestTutorialNavNodes(manifest.tutorial.entries, (entry) =>
	nodeForSlug(entry === 'index' ? 'book' : `book/${entry}`, tutorialPart),
);

const tutorialSequence = manifest.tutorial.entries
	.filter((e) => e !== 'index')
	.map((entry) => {
		const slug = `book/${entry}`;
		const n = nodeForSlug(slug, manifest.tutorial.label);
		if (!n.href) {
			throw new Error(`Book nav: no page for tutorial entry "${entry}" (slug ${n.slug})`);
		}
		return { slug: n.slug, href: n.href, title: n.title };
	});

const referenceNodes = buildDirTree(
	path.join(BOOK_ROOT, manifest.reference.directory),
	`book/${manifest.reference.directory}`,
	manifest.reference.label,
);

const appendixNodes = manifest.appendix.entries.map((entry) =>
	nodeForSlug(`book/${entry}`, manifest.appendix.label),
);

const tree = {
	slug: 'book',
	href: '/book/',
	title: nodeForSlug('book', '').title,
	children: [
		{
			slug: 'book-part-tutorial',
			href: '/book/',
			title: manifest.tutorial.label,
			part: manifest.tutorial.label,
			defaultOpen: manifest.tutorial.defaultOpen,
			children: tutorialNodes,
		},
		{
			slug: 'book-part-reference',
			href: '/book/reference/cli/',
			title: manifest.reference.label,
			part: manifest.reference.label,
			defaultOpen: manifest.reference.defaultOpen,
			children: referenceNodes,
		},
		{
			slug: 'book-part-appendix',
			href: '/book/appendix-spec-map/',
			title: manifest.appendix.label,
			part: manifest.appendix.label,
			defaultOpen: manifest.appendix.defaultOpen,
			children: appendixNodes,
		},
	],
};

const payload = {
	generatedAt: new Date().toISOString(),
	tree,
	tutorialSequence,
	prevNextBySlug: buildTutorialPrevNext(tutorialSequence),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(WEBSITE_ROOT, OUT_FILE)}.`);

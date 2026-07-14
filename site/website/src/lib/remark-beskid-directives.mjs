import fs from 'node:fs';
import path from 'node:path';

const KINDS = new Set(['spec', 'book', 'nexus', 'bug']);
const SPEC_ORIGIN = 'https://spec.beskid-lang.org';

function normalizeSpecPath(value) {
	const withoutOrigin = value.replace(/^https?:\/\/[^/]+/i, '');
	const clean = withoutOrigin.replace(/^\/+|\/+$/g, '');
	return clean.startsWith('platform-spec/') || clean === 'platform-spec'
		? clean
		: `platform-spec/${clean}`;
}

function resolveOpenSpecRoot() {
	if (process.env.OPENSPEC_ROOT?.trim()) return path.resolve(process.env.OPENSPEC_ROOT);
	if (process.env.BESKID_REPO_ROOT?.trim()) {
		return path.join(path.resolve(process.env.BESKID_REPO_ROOT), 'openspec');
	}
	return path.resolve(import.meta.dirname, '../../../../openspec');
}

function loadCanonicalAliases(openSpecRoot = resolveOpenSpecRoot()) {
	const catalogPath = path.join(openSpecRoot, 'catalog.json');
	if (!fs.existsSync(catalogPath)) return new Map();
	const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
	const aliases = new Map();
	for (const entry of catalog.entries ?? []) {
		if (!entry?.path) continue;
		const canonical = `/${normalizeSpecPath(entry.path)}/`.replace(/\/+/g, '/');
		for (const alias of [...(entry.legacySlugs ?? []), ...(entry.aliases ?? [])]) {
			aliases.set(normalizeSpecPath(alias), canonical);
		}
		aliases.set(normalizeSpecPath(entry.path), canonical);
	}
	return aliases;
}

function escapeHtml(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function parseFields(body) {
	const values = {};
	for (const line of body.split('\n')) {
		const match = line.match(/^([a-zA-Z][\w-]*):\s*(.+)$/);
		if (match) values[match[1]] = match[2].trim();
	}
	return values;
}

function fallbackHref(kind, ref) {
	if (kind === 'spec') {
		const capability = ref.split('#', 1)[0];
		return `${SPEC_ORIGIN}/platform-spec/capabilities/${encodeURIComponent(capability)}/`;
	}
	if (kind === 'book') return `/book/${ref.replace(/^\/+|\/+$/g, '')}/`;
	if (kind === 'nexus') return `https://nexus.beskid-lang.org/${ref.replace(/^\/+/, '')}`;
	return `https://tracker.beskid-lang.org/bugs/${encodeURIComponent(ref)}`;
}

function renderDirective(kind, body) {
	const values = parseFields(body);
	const ref = values.ref ?? values.id ?? values.slug;
	if (!ref) return null;
	const title = values.title ?? values.label ?? ref;
	const href = fallbackHref(kind, ref);
	return [
		`<script type="module" src="${SPEC_ORIGIN}/beskid-doc-embed.js"></script>`,
		`<beskid-doc-embed kind="${kind}" ref="${escapeHtml(ref)}" origin="${SPEC_ORIGIN}">`,
		`<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`,
		'</beskid-doc-embed>',
	].join('');
}

function canonicalSpecHref(value, aliases) {
	if (!/^\/?platform-spec(?:\/|$)/.test(value)) return value;
	const [pathname, suffix = ''] = value.split(/(?=[?#])/u, 2);
	const normalized = normalizeSpecPath(pathname);
	if (normalized === 'platform-spec') return `${SPEC_ORIGIN}/platform-spec/${suffix}`;
	const canonical = aliases.get(normalized);
	return canonical ? `${SPEC_ORIGIN}${canonical}${suffix}` : value;
}

function walk(node, aliases) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node.children)) {
		node.children = node.children.map((child) => {
			if (child?.type === 'link' && typeof child.url === 'string') {
				child.url = canonicalSpecHref(child.url, aliases);
			}
			if (child?.type !== 'code' || !KINDS.has(child.lang)) return child;
			const value = renderDirective(child.lang, child.value ?? '');
			return value ? { type: 'html', value } : child;
		});
		for (const child of node.children) walk(child, aliases);
	}
}

const BOOK_NOTICE = `<aside class="book-authority-notice" role="note"><strong>Informative guide.</strong> This Book page explains Beskid but does not define the standard. For normative requirements, use the <a href="${SPEC_ORIGIN}/platform-spec/">Beskid Platform Specification</a>.</aside>`;

/** Enhance typed embeds, canonicalize spec aliases, and label every Book page informative. */
export function remarkBeskidDirectives(options = {}) {
	const aliases = options.aliases ?? loadCanonicalAliases(options.openSpecRoot);
	return (tree, file) => {
		walk(tree, aliases);
		if (String(file?.path ?? '').includes('/src/content/docs/book/')) {
			tree.children.unshift({ type: 'html', value: BOOK_NOTICE });
		}
	};
}

export const __test = {
	BOOK_NOTICE,
	canonicalSpecHref,
	fallbackHref,
	loadCanonicalAliases,
	normalizeSpecPath,
	parseFields,
	renderDirective,
};

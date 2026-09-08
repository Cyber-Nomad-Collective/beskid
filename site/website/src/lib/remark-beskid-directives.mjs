import {
	DOCS_ORIGIN,
	STANDARD_HREF,
	loadStandardRouteProjection,
	normalizeStandardIdentifier,
} from './standard-routes.mjs';

const KINDS = new Set(['spec', 'book', 'nexus', 'bug']);
function normalizeSpecPath(value) {
	const clean = normalizeStandardIdentifier(value);
	return clean.startsWith('platform-spec/') || clean === 'platform-spec'
		? clean
		: `platform-spec/${clean}`;
}

function loadCanonicalAliases(openSpecRoot) {
	const projection = loadStandardRouteProjection(openSpecRoot);
	const aliases = new Map();
	for (const [alias, route] of projection.aliases) {
		aliases.set(alias, {
			href: `${DOCS_ORIGIN}${route.href}`,
			fragments: route.fragments,
		});
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

function fallbackHref(kind, ref, projection = loadStandardRouteProjection()) {
	if (kind === 'spec') {
		const [identifier] = ref.split('#', 1);
		const fragment = ref.match(/#(.+)$/u)?.[1];
		const route = projection.resolve(identifier);
		const definesFragment =
			route.kind === 'capability'
				? route.fragments.includes(fragment)
				: route.kind === 'requirement' && route.anchor === fragment;
		return `${DOCS_ORIGIN}${route.href}${fragment && definesFragment ? `#${fragment}` : ''}`;
	}
	if (kind === 'book') return `/book/${ref.replace(/^\/+|\/+$/g, '')}/`;
	if (kind === 'nexus') return `https://nexus.beskid-lang.org/${ref.replace(/^\/+/, '')}`;
	return `https://tracker.beskid-lang.org/bugs/${encodeURIComponent(ref)}`;
}

function renderDirective(kind, body, projection) {
	const values = parseFields(body);
	const ref = values.ref ?? values.id ?? values.slug;
	if (!ref) return null;
	const title = values.title ?? values.label ?? ref;
	const href = fallbackHref(kind, ref, projection);
	return [
		`<a href="${escapeHtml(href)}" data-beskid-doc-kind="${kind}" data-beskid-doc-ref="${escapeHtml(ref)}">${escapeHtml(title)}</a>`,
	].join('');
}

function canonicalSpecHref(value, aliases) {
	const withoutOrigin = value.replace(/^https?:\/\/[^/]+/i, '');
	if (!/^\/?platform-spec(?:\/|$)/.test(withoutOrigin)) return value;
	const [pathname] = value.split(/(?=[?#])/u, 1);
	const fragment = value.match(/#([^?]*)$/u)?.[1];
	const normalized = normalizeSpecPath(pathname);
	if (normalized === 'platform-spec') return STANDARD_HREF;
	const target = aliases.get(normalized);
	if (!target) {
		const query = normalized.slice('platform-spec/'.length);
		return `${STANDARD_HREF}not-found/?id=${encodeURIComponent(query)}`;
	}
	const configuredHref = typeof target === 'string' ? target : target.href;
	const href = configuredHref.startsWith('/platform-spec/capabilities/')
		? `${STANDARD_HREF}${configuredHref.slice('/platform-spec/'.length)}`
		: configuredHref;
	const fragments = typeof target === 'string' ? new Set() : target.fragments;
	const definesFragment =
		fragments instanceof Set ? fragments.has(fragment) : fragments?.includes(fragment);
	return fragment && definesFragment ? `${href}#${fragment}` : href;
}

function walk(node, aliases, projection) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node.children)) {
		node.children = node.children.map((child) => {
			if (child?.type === 'link' && typeof child.url === 'string') {
				child.url = canonicalSpecHref(child.url, aliases);
			}
			if (child?.type !== 'code' || !KINDS.has(child.lang)) return child;
			const value = renderDirective(child.lang, child.value ?? '', projection);
			return value ? { type: 'html', value } : child;
		});
		for (const child of node.children) walk(child, aliases, projection);
	}
}

const BOOK_NOTICE = `<aside class="book-authority-notice" role="note"><strong>Informative guide.</strong> This Book page explains Beskid but does not define the standard. For normative requirements, use the <a href="${STANDARD_HREF}">Beskid Standard</a>.</aside>`;

/** Enhance typed embeds, canonicalize spec aliases, and label every Book page informative. */
export function remarkBeskidDirectives(options = {}) {
	const projection = options.projection ?? loadStandardRouteProjection(options.openSpecRoot);
	const aliases = options.aliases ?? loadCanonicalAliases(options.openSpecRoot);
	return (tree, file) => {
		walk(tree, aliases, projection);
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
	loadStandardRouteProjection,
	normalizeSpecPath,
	parseFields,
	renderDirective,
};

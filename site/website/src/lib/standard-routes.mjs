import fs from 'node:fs';
import path from 'node:path';

export const DOCS_ORIGIN = 'https://beskid-lang.org';
export const STANDARD_PATH = '/docs/standard/';
export const STANDARD_HREF = `${DOCS_ORIGIN}${STANDARD_PATH}`;
const SOURCE_ROOT = 'https://github.com/Cyber-Nomad-Collective/beskid/blob/main/';

export function normalizeStandardIdentifier(value) {
	const withoutOrigin = String(value).replace(/^https?:\/\/[^/]+/i, '');
	const pathname = withoutOrigin.split(/[?#]/u, 1)[0];
	return pathname.replace(/^\/+|\/+$/g, '');
}

function legacyIdentifier(value) {
	const normalized = normalizeStandardIdentifier(value);
	if (normalized === 'platform-spec') return '';
	return normalized.startsWith('platform-spec/')
		? normalized.slice('platform-spec/'.length)
		: normalized;
}

function notFound(query) {
	return {
		kind: 'not-found',
		href: `${STANDARD_PATH}not-found/?id=${encodeURIComponent(query)}`,
		query,
	};
}

function requirementSourceHref(specPath, anchor) {
	return `${SOURCE_ROOT}${specPath}#${anchor}`;
}

function capabilitySourceHref(specPath) {
	return `${SOURCE_ROOT}${specPath}`;
}

export function createStandardRouteProjection(catalog) {
	const entries = catalog.entries ?? [];
	const capabilities = [];
	const requirements = [];
	const routes = [];
	const byIdentifier = new Map();
	const aliases = new Map();

	for (const entry of entries) {
		if (!entry?.id || !entry?.capability || !entry?.specPath) continue;
		const href = `${STANDARD_PATH}capabilities/${entry.capability}/`;
		const fragments = (entry.requirements ?? []).map((requirement) => requirement.anchor);
		const capability = {
			kind: 'capability',
			pathname: `capabilities/${entry.capability}`,
			href,
			id: entry.id,
			capability: entry.capability,
			title: entry.title ?? entry.capability,
			description: entry.description,
			status: entry.status,
			domain: entry.domain,
			area: entry.area,
			feature: entry.feature,
			specPath: entry.specPath,
			sourceHref: capabilitySourceHref(entry.specPath),
			fragments,
			requirements: [],
		};
		capabilities.push(capability);
		routes.push(capability);
		byIdentifier.set(entry.capability, capability);
		byIdentifier.set(entry.id, capability);

		const aliasValues = new Set([entry.path, ...(entry.aliases ?? []), ...(entry.legacySlugs ?? [])]);
		for (const alias of aliasValues) {
			const normalized = normalizeStandardIdentifier(alias);
			if (!normalized || normalized === 'platform-spec') continue;
			const existing = aliases.get(normalized);
			if (existing && existing.capability !== capability.capability) {
				throw new Error(
					`Catalog alias collision for ${normalized}: ${existing.capability} and ${capability.capability}`,
				);
			}
			aliases.set(normalized, capability);
		}

		for (const requirement of entry.requirements ?? []) {
			if (!requirement?.id || !requirement?.anchor) continue;
			const requirementRoute = {
				kind: 'requirement',
				pathname: `requirements/${requirement.id}`,
				href: `${STANDARD_PATH}requirements/${requirement.id}/`,
				id: requirement.id,
				title: requirement.title,
				status: requirement.status,
				migrationStatus: requirement.migrationStatus,
				anchor: requirement.anchor,
				sourceHref: requirementSourceHref(entry.specPath, requirement.anchor),
				capability: {
					id: capability.id,
					key: capability.capability,
					title: capability.title,
					href: capability.href,
				},
			};
			requirements.push(requirementRoute);
			routes.push(requirementRoute);
			capability.requirements.push(requirementRoute);
			byIdentifier.set(requirement.id, requirementRoute);
		}
	}

	const notFoundRoute = {
		kind: 'not-found',
		pathname: 'not-found',
		href: `${STANDARD_PATH}not-found/`,
		title: 'Standard identifier not found',
	};
	routes.push(notFoundRoute);

	return {
		revision: catalog.revision,
		capabilities,
		requirements,
		routes,
		aliases,
		resolve(value) {
			const normalized = normalizeStandardIdentifier(value);
			if (!normalized || normalized === 'platform-spec' || normalized === 'docs/standard') {
				return { kind: 'index', href: STANDARD_PATH };
			}
			if (byIdentifier.has(normalized)) return byIdentifier.get(normalized);
			if (aliases.has(normalized)) return aliases.get(normalized);
			if (normalized.startsWith('docs/standard/capabilities/')) {
				const id = normalized.slice('docs/standard/capabilities/'.length);
				if (byIdentifier.has(id)) return byIdentifier.get(id);
			}
			if (normalized.startsWith('docs/standard/requirements/')) {
				const id = normalized.slice('docs/standard/requirements/'.length);
				if (byIdentifier.has(id)) return byIdentifier.get(id);
			}
			return notFound(legacyIdentifier(normalized));
		},
	};
}

export function resolveOpenSpecRoot() {
	if (process.env.OPENSPEC_ROOT?.trim()) return path.resolve(process.env.OPENSPEC_ROOT);
	if (process.env.BESKID_REPO_ROOT?.trim()) {
		return path.join(path.resolve(process.env.BESKID_REPO_ROOT), 'openspec');
	}
	const candidates = [
		path.resolve(process.cwd(), 'openspec'),
		path.resolve(process.cwd(), '../../openspec'),
		path.resolve(import.meta.dirname, '../../../../openspec'),
	];
	return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'catalog.json'))) ?? candidates[2];
}

export function requireOpenSpecCatalog() {
	return (
		process.env.BESKID_REQUIRE_OPENSPEC_CATALOG === '1' ||
		process.env.CI === 'true' ||
		process.env.NODE_ENV === 'production'
	);
}

export function loadStandardRouteProjection(openSpecRoot = resolveOpenSpecRoot()) {
	const catalogPath = path.join(openSpecRoot, 'catalog.json');
	const hardFail = requireOpenSpecCatalog();
	if (!fs.existsSync(catalogPath)) {
		if (hardFail) {
			throw new Error(
				`OpenSpec catalog missing at ${catalogPath}; Standard routes require openspec/catalog.json`,
			);
		}
		return createStandardRouteProjection({ entries: [] });
	}
	const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
	if ((catalog.entries ?? []).length === 0 && hardFail) {
		throw new Error(
			`OpenSpec catalog at ${catalogPath} has zero entries; Standard routes require a non-empty catalog`,
		);
	}
	return createStandardRouteProjection(catalog);
}

export function createLegacyStandardRedirects(projection = loadStandardRouteProjection()) {
	const redirects = {};
	for (const [legacy, capability] of projection.aliases) {
		redirects[`/${legacy}/`] = capability.href;
		const relative = legacy.slice('platform-spec/'.length);
		if (relative && !relative.startsWith('capabilities/')) {
			redirects[`${STANDARD_PATH}${relative}/`] = capability.href;
		}
	}
	return redirects;
}

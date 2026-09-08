import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import { parse } from 'yaml';

const root = new URL('../../../../', import.meta.url);
const docsRoot = fileURLToPath(new URL('site/website/src/content/docs/docs/', root));

async function technicalDocsFiles(directory = docsRoot) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? technicalDocsFiles(entryPath) : [entryPath];
	}));
	return nested.flat().filter((filePath) => /\.mdx?$/.test(filePath)).sort();
}

function docsRoute(filePath) {
	const relative = path.relative(docsRoot, filePath).replaceAll(path.sep, '/').replace(/\.mdx?$/, '');
	const suffix = relative === 'index' ? '' : relative.endsWith('/index') ? relative.slice(0, -'/index'.length) : relative;
	return `/docs/${suffix ? `${suffix}/` : ''}`;
}

function navigationLinks(items) {
	return items.flatMap((item) => 'items' in item ? navigationLinks(item.items) : [item.link]);
}

function pagePaths(route) {
	const suffix = route.slice('/docs/'.length, -1);
	return [
		path.join(docsRoot, suffix, 'index.md'),
		path.join(docsRoot, `${suffix || 'index'}.md`),
	];
}

function frontmatter(source, filePath) {
	const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
	assert.ok(match, `${filePath} must start with YAML frontmatter`);
	return parse(match[1]);
}

test('catalogues every public Docs surface and keeps it aligned with the sole navigation model', async () => {
	const [coverageModule, navigationModule, files] = await Promise.all([
		tsImport('../data/docs-coverage.ts', import.meta.url),
		tsImport('../data/docs-navigation.ts', import.meta.url),
		technicalDocsFiles(),
	]);
	const coverage = coverageModule.docsCoverage;
	const keys = coverage.map((surface) => surface.key);
	const routes = coverage.map((surface) => surface.route).sort();
	const expectedRoutes = files.map(docsRoute).sort();

	assert.equal(new Set(keys).size, keys.length, 'every public Docs surface must have one unique stable key');
	for (const key of keys) {
		assert.equal(typeof key, 'string', 'every public Docs surface must define a stable key');
		assert.match(key, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${key} must use stable slug format`);
	}
	assert.deepEqual(keys.slice(0, 4), ['docs-home', 'evaluation-readiness', 'beskid-learn', 'getting-started'], 'stable keys must remain independent from display text');
	assert.deepEqual(routes, [...expectedRoutes].sort(), 'every public Docs surface must have one coverage entry');
	assert.deepEqual(
		[...new Set(navigationLinks(navigationModule.docsNavigation).filter((link) => link.startsWith('/docs/')))].sort(),
		[...expectedRoutes].sort(),
		'docsNavigation must expose every covered Docs route',
	);

	for (const surface of coverage) {
		assert.equal(typeof surface.surface, 'string', `${surface.route} must name its public surface`);
		assert.ok(surface.surface.length > 0, `${surface.route} must name its public surface`);
		assert.ok(Array.isArray(surface.audience) && surface.audience.length > 0, `${surface.route} must name its audience`);
		assert.equal(typeof surface.sourceBoundary, 'string', `${surface.route} must name its source boundary`);
		assert.ok(surface.sourceBoundary.length > 0, `${surface.route} must name its source boundary`);
		assert.ok(['task', 'guide', 'reference'].includes(surface.pageKind), `${surface.route} must classify its page kind`);
		assert.ok(['required', 'not-needed'].includes(surface.diagramPolicy), `${surface.route} must classify its diagram policy`);
		if (surface.diagramPolicy === 'not-needed') {
			assert.equal(typeof surface.diagramOmissionReason, 'string', `${surface.route} must explain why it omits a diagram`);
			assert.ok(surface.diagramOmissionReason.length > 0, `${surface.route} must explain why it omits a diagram`);
		}

		const data = frontmatter(await Promise.any(pagePaths(surface.route).map((filePath) => readFile(filePath, 'utf8'))), surface.route);
		assert.deepEqual(data.audience, surface.audience, `${surface.route} audience must match its catalogue entry`);
		assert.equal(data.authority.sourceHref, surface.sourceBoundary, `${surface.route} authority boundary must match its catalogue entry`);
		assert.equal(data.pageKind, surface.pageKind, `${surface.route} page kind must match its catalogue entry`);
		assert.equal(data.diagramPolicy, surface.diagramPolicy, `${surface.route} diagram policy must match its catalogue entry`);
		assert.equal(data.diagramOmissionReason, surface.diagramOmissionReason, `${surface.route} diagram omission reason must match its catalogue entry`);
	}
});

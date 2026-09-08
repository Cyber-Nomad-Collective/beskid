import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import { parse } from 'yaml';

const root = new URL('../../../../', import.meta.url);
const docsRoot = fileURLToPath(new URL('site/website/src/content/docs/docs/', root));

const expectedRoutes = [
	'/docs/',
	'/docs/evaluate/',
	'/docs/learn/',
	'/docs/getting-started/',
	'/docs/getting-started/install/',
	'/docs/getting-started/first-program/',
	'/docs/getting-started/editor/',
	'/docs/getting-started/troubleshooting/',
	'/docs/editor/',
	'/docs/editor/vs-code/',
	'/docs/extend/',
	'/docs/extend/bsol/',
	'/docs/extend/templates/',
	'/docs/extend/tree-sitter/',
	'/docs/extend/web-packages/',
	'/docs/tooling/',
	'/docs/tooling/build-run-test/',
	'/docs/tooling/ci/',
	'/docs/language-basics/',
	'/docs/projects/',
	'/docs/projects/create/',
	'/docs/projects/workspaces/',
	'/docs/projects/dependencies-and-locks/',
	'/docs/packages/',
	'/docs/packages/publish/',
	'/docs/packages/consume/',
	'/docs/packages/credentials-and-recovery/',
	'/docs/platform/',
	'/docs/platform/account/',
	'/docs/platform/tracker/',
	'/docs/platform/report-bug/',
	'/docs/platform/nexus/',
	'/docs/services/',
	'/docs/services/authentication/',
	'/docs/services/learn/',
	'/docs/services/pckg/',
	'/docs/services/tracker/',
	'/docs/services/nexus/',
	'/docs/operations/',
	'/docs/operations/containers/',
	'/docs/operations/deployment/',
	'/docs/operations/health-and-monitoring/',
	'/docs/contributing/',
	'/docs/contributing/repository/',
	'/docs/contributing/superrepo-workflow/',
	'/docs/contributing/learn-curriculum/',
	'/docs/contributing/standard-changes/',
	'/docs/contributing/documentation/',
	'/docs/contributing/ste-100/',
	'/docs/reference/',
	'/docs/reference/licensing/',
	'/docs/standard/',
];

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
	const [coverageModule, navigationModule] = await Promise.all([
		tsImport('../data/docs-coverage.ts', import.meta.url),
		tsImport('../data/docs-navigation.ts', import.meta.url),
	]);
	const coverage = coverageModule.docsCoverage;
	const routes = coverage.map((surface) => surface.route).sort();

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

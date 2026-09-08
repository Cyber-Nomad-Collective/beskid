import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import { parse } from 'yaml';

const root = new URL('../../../../', import.meta.url);
const docsRoot = fileURLToPath(new URL('site/website/src/content/docs/docs/', root));
const read = (filePath) => readFile(new URL(filePath, root), 'utf8');

async function technicalDocsFiles(directory = docsRoot) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? technicalDocsFiles(entryPath) : [entryPath];
	}));
	return nested.flat().filter((filePath) => /\.mdx?$/.test(filePath)).sort();
}

function frontmatter(source, filePath) {
	const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
	assert.ok(match, `${filePath} must start with YAML frontmatter`);
	return parse(match[1]);
}

function docsRoute(filePath) {
	const relative = path.relative(docsRoot, filePath).replaceAll(path.sep, '/').replace(/\.mdx?$/, '');
	const suffix = relative === 'index' ? '' : relative.endsWith('/index') ? relative.slice(0, -'/index'.length) : relative;
	return `/docs/${suffix ? `${suffix}/` : ''}`;
}

function navigationLinks(items) {
	return items.flatMap((item) => 'items' in item ? navigationLinks(item.items) : [item.link]);
}

test('requires complete typed annotation metadata on every technical Docs page', async () => {
	const allowedStatuses = new Set([
		'normative',
		'informative',
		'generated',
		'preview',
		'deprecated',
		'security-sensitive',
	]);

	for (const filePath of await technicalDocsFiles()) {
		const data = frontmatter(await readFile(filePath, 'utf8'), filePath);
		assert.ok(Array.isArray(data.audience) && data.audience.length > 0, `${filePath} must define a non-empty audience`);
		assert.ok(data.audience.every((audience) => typeof audience === 'string' && audience.length > 0), `${filePath} audiences must be non-empty strings`);
		assert.ok(allowedStatuses.has(data.authority?.status), `${filePath} must define a permitted authority status`);
		assert.equal(typeof data.authority?.sourceLabel, 'string', `${filePath} must define authority.sourceLabel`);
		assert.equal(typeof data.authority?.sourceHref, 'string', `${filePath} must define authority.sourceHref`);
		assert.equal(typeof data.authority?.limits, 'string', `${filePath} must define authority.limits`);
		assert.ok(['task', 'guide', 'reference'].includes(data.pageKind), `${filePath} must define a permitted pageKind`);
		assert.ok(['required', 'not-needed'].includes(data.diagramPolicy), `${filePath} must define a permitted diagramPolicy`);
		if (data.diagramPolicy === 'not-needed') {
			assert.equal(typeof data.diagramOmissionReason, 'string', `${filePath} must explain why a diagram is not needed`);
			assert.ok(data.diagramOmissionReason.length > 0, `${filePath} must explain why a diagram is not needed`);
		}
		assert.match(data.verified?.revision ?? '', /^[0-9a-f]{40}$/, `${filePath} must define a Git revision`);
		assert.match(String(data.verified?.date ?? ''), /^2026-09-08$/, `${filePath} must define the verification date`);
	}
});

test('pins immutable verified authority URLs to an immutable revision', async () => {
	for (const filePath of await technicalDocsFiles()) {
		const data = frontmatter(await readFile(filePath, 'utf8'), filePath);
		if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\//.test(data.authority?.sourceHref ?? '')) {
			assert.match(data.authority.sourceHref, /\/(?:blob|tree)\/[0-9a-f]{40}(?:\/|$)/, `${filePath} must pin its authority URL to an immutable revision`);
			assert.doesNotMatch(data.authority.sourceHref, /\/(?:blob|tree)\/main(?:\/|$)/, `${filePath} must not use a mutable main authority URL`);
		}
	}
});

test('rejects retired project manifest names in active technical Docs', async () => {
	for (const filePath of await technicalDocsFiles()) {
		assert.doesNotMatch(await readFile(filePath, 'utf8'), /\b(?:Project|Workspace)\.proj\b/, filePath);
	}
});

test('keeps command and project authority out of mutable Book pages', async () => {
	const expectedSources = new Map([
		['getting-started/index.md', 'https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/cli.rs'],
		['getting-started/first-program.md', 'https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/cli.rs'],
		['tooling/index.md', 'https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/cli.rs'],
		['projects/index.md', 'https://github.com/Cyber-Nomad-Collective/beskid/blob/35fdb92cd9c4ad8f61e3d06d7171e94a694b2562/openspec/specs/tooling--manifests-and-lockfiles--project-manifest-contract/spec.md'],
		['packages/index.md', 'https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_pckg/src/cli.rs'],
	]);

	for (const [relativePath, expectedSource] of expectedSources) {
		const filePath = path.join(docsRoot, relativePath);
		const data = frontmatter(await readFile(filePath, 'utf8'), filePath);
		assert.equal(data.authority.sourceHref, expectedSource, `${filePath} must link its exact pinned authority`);
		assert.doesNotMatch(data.authority.sourceHref, /^\/book\//, `${filePath} must not use the Book as command authority`);
	}
});

test('uses docsNavigation as the sole navigation model and covers every technical Docs route', async () => {
	const [config, websiteHeader, sharedHeader, docsRail, navigationData, navigationTypes, files] = await Promise.all([
		read('site/website/astro.config.mjs'),
		read('site/website/src/components/starlight/Header.astro'),
		read('beskid_web_common/packages/beskid-ui/src/starlight/Header.astro'),
		read('beskid_web_common/packages/beskid-ui/src/docs/DocsNavChrome.astro'),
		read('site/website/src/data/docs-navigation.ts'),
		read('beskid_web_common/packages/beskid-ui/src/docs/docs-navigation.ts'),
		technicalDocsFiles(),
	]);
	const navigationModule = await tsImport('../data/docs-navigation.ts', import.meta.url);
	const links = navigationLinks(navigationModule.docsNavigation);
	const routes = files.map(docsRoute).sort();

	assert.match(config, /import \{ docsNavigation \} from ['"]\.\/src\/data\/docs-navigation['"]/);
	assert.match(config, /sidebar:\s*docsNavigation/);
	assert.match(config, /Header:\s*['"]\.\/src\/components\/starlight\/Header\.astro['"]/);
	assert.doesNotMatch(config, /@beskid\/docs-navigation/);
	assert.match(websiteHeader, /import \{ docsNavigation \} from ['"]\.\.\/\.\.\/data\/docs-navigation['"]/);
	assert.match(websiteHeader, /<SharedHeader docsNavigation=\{docsNavigation\} \/>/);
	assert.match(sharedHeader, /docsNavigation:\s*DocsNavigationGroup\[\]/);
	assert.match(sharedHeader, /<DocsNavChrome currentPath=\{path\} navigation=\{docsNavigation\} \/>/);
	assert.match(docsRail, /navigation:\s*DocsNavigationGroup\[\]/);
	assert.match(docsRail, /const \{ currentPath, navigation \} = Astro\.props/);
	assert.doesNotMatch(docsRail, /@beskid\/docs-navigation/);
	assert.match(navigationData, /import type \{ DocsNavigationGroup \} from ['"]@beskid\/beskid-ui\/docs\/docs-navigation['"]/);
	assert.match(navigationTypes, /export interface DocsNavigationGroup/);
	assert.doesNotMatch(docsRail, /href="\/docs\//);
	assert.deepEqual([...new Set(links.filter((link) => link.startsWith('/docs/')))].sort(), routes);
});

test('renders every Docs annotation field directly after the page title', async () => {
	const [pageTitle, blogAwareTitle] = await Promise.all([
		read('site/website/src/components/starlight/DocsPageTitle.astro'),
		read('site/website/src/components/starlight/BlogAwarePageTitle.astro'),
	]);

	assert.match(blogAwareTitle, /import DocsPageTitle from ['"]\.\/DocsPageTitle\.astro['"]/);
	assert.match(blogAwareTitle, /<DocsPageTitle \/>/);
	assert.match(pageTitle, /<h1[^>]*id=\{PAGE_TITLE_ID\}/);
	assert.match(pageTitle, /<aside[^>]*aria-label="Document authority"/);
	assert.ok(pageTitle.indexOf('<aside') > pageTitle.indexOf('<h1'), 'the annotation must follow the page title');
	for (const field of ['status', 'sourceLabel', 'sourceHref', 'limits', 'audience', 'revision', 'date']) {
		assert.match(pageTitle, new RegExp(`\\b${field}\\b`), `DocsPageTitle must render ${field}`);
	}
});

test('does not keep manual document annotations in technical Docs source', async () => {
	for (const filePath of await technicalDocsFiles()) {
		assert.doesNotMatch(await readFile(filePath, 'utf8'), /^## Document annotation$/m, filePath);
	}
});

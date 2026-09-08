import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { __test } from './remark-beskid-directives.mjs';
import * as standardRoutes from './standard-routes.mjs';

const openSpecRoot = path.resolve(import.meta.dirname, '../../../../openspec');

test('catalog projection exposes one canonical public page for every capability and requirement', () => {
	const projection = __test.loadStandardRouteProjection(openSpecRoot);
	assert.equal(projection.capabilities.length, 198);
	assert.equal(projection.requirements.length, 571);
	assert.equal(new Set(projection.routes.map((route) => route.pathname)).size, projection.routes.length);
});

test('catalog projection resolves capability keys, stable IDs, and legacy aliases', () => {
	const projection = __test.loadStandardRouteProjection(openSpecRoot);
	const capability = projection.resolve('compiler--build-pipeline--backends-jit-aot');
	assert.equal(
		capability.href,
		'/docs/standard/capabilities/compiler--build-pipeline--backends-jit-aot/',
	);

	const requirement = projection.resolve('BSP-REQ-CD8B19C86E87');
	assert.equal(
		requirement.href,
		'/docs/standard/requirements/BSP-REQ-CD8B19C86E87/',
	);
	assert.equal(
		requirement.sourceHref,
		'https://github.com/Cyber-Nomad-Collective/beskid/blob/main/openspec/specs/compiler--build-pipeline--backends-jit-aot/spec.md#requirement-shared-codegenartifact-for-jit-and-aot-decision-d-comp-build-0003',
	);

	assert.equal(
		projection.resolve('/platform-spec/compiler/build-pipeline/backends-jit-aot/').href,
		capability.href,
	);
});

test('unknown identifiers resolve only to the Standard not-found search page', () => {
	const projection = __test.loadStandardRouteProjection(openSpecRoot);
	const unknown = projection.resolve('not/a/catalog-entry');
	assert.deepEqual(unknown, {
		kind: 'not-found',
		href: '/docs/standard/not-found/?id=not%2Fa%2Fcatalog-entry',
		query: 'not/a/catalog-entry',
	});
});

test('legacy redirects preserve capability identity for old and friendly Standard paths', () => {
	const projection = __test.loadStandardRouteProjection(openSpecRoot);
	const redirects = standardRoutes.createLegacyStandardRedirects(projection);
	const target = '/docs/standard/capabilities/compiler--build-pipeline--backends-jit-aot/';
	assert.equal(redirects['/platform-spec/compiler/build-pipeline/backends-jit-aot/'], target);
	assert.equal(redirects['/docs/standard/compiler/build-pipeline/backends-jit-aot/'], target);
	assert.notEqual(
		redirects['/platform-spec/compiler/build-pipeline/backends-jit-aot/'],
		'/docs/standard/',
	);
});

test('catalog root resolution survives Astro bundling away from the source module', async () => {
	const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'beskid-standard-routes-'));
	const bundledDirectory = path.join(temporaryRoot, 'dist', '.prerender', 'chunks');
	fs.mkdirSync(bundledDirectory, { recursive: true });
	const bundledModule = path.join(bundledDirectory, 'standard-routes.mjs');
	fs.copyFileSync(path.resolve(import.meta.dirname, 'standard-routes.mjs'), bundledModule);
	try {
		const bundled = await import(`${pathToFileURL(bundledModule).href}?test=${Date.now()}`);
		assert.equal(bundled.resolveOpenSpecRoot(), openSpecRoot);
	} finally {
		fs.rmSync(temporaryRoot, { recursive: true, force: true });
	}
});

test('catalog projection rejects an alias owned by two capabilities', () => {
	const entry = (id, capability) => ({
		id,
		capability,
		specPath: `openspec/specs/${capability}/spec.md`,
		path: `/platform-spec/capabilities/${capability}/`,
		aliases: ['/platform-spec/shared/alias/'],
		requirements: [],
	});
	assert.throws(
		() =>
			standardRoutes.createStandardRouteProjection({
				entries: [entry('BSP-CAP-ONE', 'one'), entry('BSP-CAP-TWO', 'two')],
			}),
		/Catalog alias collision.*platform-spec\/shared\/alias.*one.*two/,
	);
});

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
	fs.copyFileSync(
		path.resolve(import.meta.dirname, 'standard-id-checker.mjs'),
		path.join(bundledDirectory, 'standard-id-checker.mjs'),
	);
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

test('identifier search resolves capability IDs, requirement IDs, and capability keys', () => {
	const projection = __test.loadStandardRouteProjection(openSpecRoot);
	const index = standardRoutes.createStandardSearchIndex(projection);
	assert.equal(
		standardRoutes.resolveStandardSearch(index, ' BSP-CAP-DA123DD4F7F0 '),
		'/docs/standard/capabilities/tooling--cli--command-surface/',
	);
	assert.equal(
		standardRoutes.resolveStandardSearch(index, 'BSP-REQ-942B8B35A6BB'),
		'/docs/standard/requirements/BSP-REQ-942B8B35A6BB/',
	);
	assert.equal(
		standardRoutes.resolveStandardSearch(index, 'tooling--cli--command-surface'),
		'/docs/standard/capabilities/tooling--cli--command-surface/',
	);
	assert.equal(standardRoutes.resolveStandardSearch(index, 'BSP-REQ-NOT-REAL'), null);
});

test('Nginx redirect projection uses exact safe locations for every legacy alias', () => {
	const projection = __test.loadStandardRouteProjection(openSpecRoot);
	const nginx = standardRoutes.renderNginxStandardRedirects(projection);
	assert.match(
		nginx,
		/location = \/platform-spec\/tooling\/cli\/command-surface\/ \{\n\s+return 301 \/docs\/standard\/capabilities\/tooling--cli--command-surface\/;\n\s*\}/,
	);
	assert.match(
		nginx,
		/location = \/platform-spec\/tooling\/cli\/command-surface \{\n\s+return 301 \/docs\/standard\/capabilities\/tooling--cli--command-surface\/;\n\s*\}/,
	);
	assert.doesNotMatch(nginx, /\$(?:request_uri|uri|args)/);
	assert.equal((nginx.match(/location = \/platform-spec\//g) ?? []).length, 2476);
});

test('Nginx redirect projection rejects catalog text that could become a directive', () => {
	assert.throws(
		() =>
			standardRoutes.renderNginxStandardRedirects({
				aliases: new Map([
					[
						'platform-spec/unsafe\nreturn 302 https://example.com',
						{
							capability: 'unsafe',
							href: '/docs/standard/capabilities/unsafe/',
						},
					],
				]),
			}),
		/Unsafe Platform Spec redirect source/,
	);
});

test('identifier checker navigates on an exact match and reports an unknown identifier', () => {
	let submit;
	const form = { addEventListener: (_event, handler) => (submit = handler) };
	const field = { value: 'BSP-REQ-942B8B35A6BB' };
	const status = { hidden: true, textContent: '' };
	const destinations = [];
	const queries = [];
	standardRoutes.bindStandardIdChecker({
		form,
		field,
		status,
		index: [{ identifier: 'BSP-REQ-942B8B35A6BB', href: '/docs/standard/requirements/BSP-REQ-942B8B35A6BB/' }],
		navigate: (href) => destinations.push(href),
		updateQuery: (value) => queries.push(value),
	});

	let prevented = false;
	submit({ preventDefault: () => (prevented = true) });
	assert.equal(prevented, true);
	assert.deepEqual(destinations, ['/docs/standard/requirements/BSP-REQ-942B8B35A6BB/']);

	field.value = 'BSP-REQ-NOT-REAL';
	submit({ preventDefault() {} });
	assert.deepEqual(queries, ['BSP-REQ-NOT-REAL']);
	assert.equal(status.hidden, false);
	assert.equal(status.textContent, 'No Standard catalog record matches “BSP-REQ-NOT-REAL”.');
});

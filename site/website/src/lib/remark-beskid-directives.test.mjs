import assert from 'node:assert/strict';
import test from 'node:test';

import { __test, remarkBeskidDirectives } from './remark-beskid-directives.mjs';

test('renders a spec directive as a standard link', () => {
	const html = __test.renderDirective(
		'spec',
		'ref: compiler--build-pipeline--backends-jit-aot\ntitle: AOT backends',
	);
	assert.match(html, /data-beskid-doc-kind="spec"/);
	assert.match(
		html,
		/href="https:\/\/beskid-lang\.org\/docs\/standard\/capabilities\/compiler--build-pipeline--backends-jit-aot\/"/,
	);
	assert.match(html, />AOT backends<\/a>/);
});

test('renders a spec directive with a defined requirement fragment', () => {
	const fragment = 'requirement-shared-codegenartifact-for-jit-and-aot-decision-d-comp-build-0003';
	const html = __test.renderDirective(
		'spec',
		`ref: compiler--build-pipeline--backends-jit-aot#${fragment}\ntitle: Shared artifact requirement`,
	);
	assert.match(
		html,
		new RegExp(`/capabilities/compiler--build-pipeline--backends-jit-aot/#${fragment}`),
	);
});

test('remark transformer only replaces supported typed fences', () => {
	const tree = {
		type: 'root',
		children: [
			{ type: 'code', lang: 'book', value: 'ref: 14-from-source-to-runs' },
			{ type: 'code', lang: 'ts', value: 'const value = 1' },
		],
	};
	remarkBeskidDirectives({ aliases: new Map() })(tree);
	assert.equal(tree.children[0].type, 'html');
	assert.equal(tree.children[1].type, 'code');
});

test('rewrites legacy platform-spec links to catalog-backed canonical URLs', () => {
	const aliases = new Map([
		[
			'platform-spec/language/syntax/blocks',
			'/platform-spec/capabilities/language--syntax--blocks/',
		],
	]);
	const tree = {
		type: 'root',
		children: [
			{
				type: 'paragraph',
				children: [
					{ type: 'link', url: '/platform-spec/language/syntax/blocks', children: [] },
				],
			},
		],
	};
	remarkBeskidDirectives({ aliases })(tree);
	assert.equal(
		tree.children[0].children[0].url,
		'https://beskid-lang.org/docs/standard/capabilities/language--syntax--blocks/',
	);
});

test('preserves a catalog-defined requirement fragment on a legacy link', () => {
	const fragment = 'requirement-shared-codegenartifact-for-jit-and-aot-decision-d-comp-build-0003';
	const aliases = new Map([
		[
			'platform-spec/compiler/build-pipeline/backends-jit-aot',
			{
				href: 'https://beskid-lang.org/docs/standard/capabilities/compiler--build-pipeline--backends-jit-aot/',
				fragments: new Set([fragment]),
			},
		],
	]);
	assert.equal(
		__test.canonicalSpecHref(
			`/platform-spec/compiler/build-pipeline/backends-jit-aot/#${fragment}`,
			aliases,
		),
		`https://beskid-lang.org/docs/standard/capabilities/compiler--build-pipeline--backends-jit-aot/#${fragment}`,
	);
});

test('rewrites an absolute legacy URL without losing its defined fragment', () => {
	const fragment = 'requirement-stable-cli-command-families';
	const aliases = new Map([
		[
			'platform-spec/tooling/cli/command-surface',
			{
				href: 'https://beskid-lang.org/docs/standard/capabilities/tooling--cli--command-surface/',
				fragments: [fragment],
			},
		],
	]);
	assert.equal(
		__test.canonicalSpecHref(
			`https://beskid-lang.org/platform-spec/tooling/cli/command-surface/#${fragment}`,
			aliases,
		),
		`https://beskid-lang.org/docs/standard/capabilities/tooling--cli--command-surface/#${fragment}`,
	);
});

test('does not rewrite a platform-spec path on an unrelated origin', () => {
	const url = 'https://example.com/platform-spec/tooling/cli/command-surface/';
	assert.equal(__test.canonicalSpecHref(url, new Map()), url);
});

test('sends an unknown legacy identifier to the Standard search state', () => {
	assert.equal(
		__test.canonicalSpecHref('/platform-spec/not/a/catalog-entry/', new Map()),
		'https://beskid-lang.org/docs/standard/not-found/?id=not%2Fa%2Fcatalog-entry',
	);
});

test('labels every Book source as informative', () => {
	const tree = { type: 'root', children: [{ type: 'paragraph', children: [] }] };
	remarkBeskidDirectives({ aliases: new Map() })(tree, {
		path: '/repo/site/website/src/content/docs/book/intro.md',
	});
	assert.equal(tree.children[0].type, 'html');
	assert.match(tree.children[0].value, /Informative guide/);
	assert.match(tree.children[0].value, /Beskid Standard/);
});

test('loadCanonicalAliases hard-fails when catalog is required and missing', () => {
	const previous = process.env.BESKID_REQUIRE_OPENSPEC_CATALOG;
	process.env.BESKID_REQUIRE_OPENSPEC_CATALOG = '1';
	try {
		assert.throws(
			() => __test.loadCanonicalAliases('/nonexistent/openspec-root'),
			/OpenSpec catalog missing/,
		);
	} finally {
		if (previous === undefined) delete process.env.BESKID_REQUIRE_OPENSPEC_CATALOG;
		else process.env.BESKID_REQUIRE_OPENSPEC_CATALOG = previous;
	}
});

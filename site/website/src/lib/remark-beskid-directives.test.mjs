import assert from 'node:assert/strict';
import test from 'node:test';

import { __test, remarkBeskidDirectives } from './remark-beskid-directives.mjs';

test('renders a spec directive as an embeddable element with fallback', () => {
	const html = __test.renderDirective(
		'spec',
		'ref: compiler--pipeline--aot#artifact\ntitle: AOT artifact',
	);
	assert.match(html, /<beskid-doc-embed kind="spec"/);
	assert.match(html, />AOT artifact<\/a>/);
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
		'https://spec.beskid-lang.org/platform-spec/capabilities/language--syntax--blocks/',
	);
});

test('labels every Book source as informative', () => {
	const tree = { type: 'root', children: [{ type: 'paragraph', children: [] }] };
	remarkBeskidDirectives({ aliases: new Map() })(tree, {
		path: '/repo/site/website/src/content/docs/book/intro.md',
	});
	assert.equal(tree.children[0].type, 'html');
	assert.match(tree.children[0].value, /Informative guide/);
	assert.match(tree.children[0].value, /Beskid Platform Specification/);
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

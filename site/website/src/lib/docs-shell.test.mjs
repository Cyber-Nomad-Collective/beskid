import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../../../', import.meta.url);

const read = (path) => readFile(new URL(path, root), 'utf8');

test('keeps search in documentation chrome and gives Docs a navigation rail', async () => {
	const [header, docsRail, config] = await Promise.all([
		read('beskid_web_common/packages/beskid-ui/src/starlight/Header.astro'),
		read('beskid_web_common/packages/beskid-ui/src/docs/DocsNavChrome.astro'),
		read('site/website/astro.config.mjs'),
	]);

	assert.doesNotMatch(header, /import Search from 'virtual:starlight\/components\/Search'/);
	assert.doesNotMatch(header, /beskid-header__search/);
	assert.match(header, /DocsNavChrome/);
	assert.match(docsRail, /aria-label="Docs contents"/);
	assert.match(docsRail, /<Search \/>/);
	assert.match(config, /htmlSubdir: 'docs'/);
});

test('renders Docs and Standard titles once', async () => {
	const [docs, standard] = await Promise.all([
		read('site/website/src/content/docs/docs/index.md'),
		read('site/website/src/content/docs/docs/standard/index.md'),
	]);
	assert.equal((docs.match(/^# Beskid Docs$/gm) ?? []).length, 0);
	assert.equal((standard.match(/^# Beskid Standard$/gm) ?? []).length, 0);
});

test('registers Beskid code fences with the Docs highlighter', async () => {
	const [firstProgram, config] = await Promise.all([
		read('site/website/src/content/docs/docs/getting-started/first-program.md'),
		read('site/website/astro.config.mjs'),
	]);

	assert.match(firstProgram, /```beskid\ni32 Main\(\)/);
	assert.match(config, /expressiveCode:[\s\S]*?langs: \/\*\* @type \{any\} \*\/ \(\[beskidGrammar\]\)/);
});

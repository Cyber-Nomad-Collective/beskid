import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../../../../', import.meta.url);
const docsRoot = fileURLToPath(new URL('site/website/src/content/docs/docs/', root));

const read = (path) => readFile(new URL(path, root), 'utf8');

async function technicalDocsFiles(directory = docsRoot) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? technicalDocsFiles(entryPath) : [entryPath];
	}));
	return nested.flat().filter((filePath) => /\.mdx?$/.test(filePath)).sort();
}

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

test('leaves the only technical Docs H1 to the shared page-title renderer', async () => {
	for (const filePath of await technicalDocsFiles()) {
		assert.doesNotMatch(await readFile(filePath, 'utf8'), /^# /m, filePath);
	}
});

test('registers Beskid code fences with the Docs highlighter', async () => {
	const [firstProgram, config] = await Promise.all([
		read('site/website/src/content/docs/docs/getting-started/first-program.md'),
		read('site/website/astro.config.mjs'),
	]);

	assert.match(firstProgram, /```beskid\ni32 Main\(\)/);
	assert.match(config, /expressiveCode:[\s\S]*?langs: \/\*\* @type \{any\} \*\/ \(\[beskidGrammar\]\)/);
});

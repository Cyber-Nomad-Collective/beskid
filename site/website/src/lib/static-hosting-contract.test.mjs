import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(testDir, '../..');

test('installs the Astro trudoc integration under its import name', async () => {
	const packageJson = JSON.parse(await readFile(path.join(siteRoot, 'package.json'), 'utf8'));
	assert.ok(packageJson.dependencies.trudoc);
	assert.equal(packageJson.dependencies['@cyber-nomad-collective/trudoc'], undefined);
});

test('keeps JSON endpoints prerendered for the static Nginx image', async () => {
	for (const route of ['releases.json.ts', 'version.json.ts']) {
		const source = await readFile(path.join(siteRoot, 'src/pages/api', route), 'utf8');
		assert.doesNotMatch(source, /prerender\s*=\s*false/);
	}
});

test('registers the React renderer required by interactive download components', async () => {
	const packageJson = JSON.parse(await readFile(path.join(siteRoot, 'package.json'), 'utf8'));
	const astroConfig = await readFile(path.join(siteRoot, 'astro.config.mjs'), 'utf8');
	assert.ok(packageJson.dependencies['@astrojs/react']);
	assert.match(astroConfig, /import react from '@astrojs\/react';/);
	assert.match(astroConfig, /integrations:\s*\[[\s\S]*?react\(\)/);
	assert.match(astroConfig, /esbuild:\s*\{\s*jsx:\s*'automatic',\s*jsxImportSource:\s*'react'/);
	assert.match(astroConfig, /noExternal:\s*\[[^\]]*'@beskid\/ui-react'/);
	assert.match(astroConfig, /dedupe:\s*\['react', 'react-dom'\]/);
});

test('renders the interactive downloads widget only in the browser', async () => {
	const source = await readFile(path.join(siteRoot, 'src/components/DownloadsPage.astro'), 'utf8');
	assert.match(source, /<DownloadsSection\s+client:only="react"/);
});

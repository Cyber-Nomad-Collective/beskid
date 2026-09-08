import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const websiteRoot = fileURLToPath(new URL('../..', import.meta.url));
const readWebsiteFile = (relativePath) => readFile(new URL(relativePath, `file://${websiteRoot}/`), 'utf8');

test('landing Download action keeps visitors in the Downloads page', async () => {
  const landing = await readWebsiteFile('src/content/docs/index.mdx');
  const downloads = await readWebsiteFile('src/content/docs/downloads.mdx');

  assert.match(downloads, /title: Download/);
  assert.match(landing, /\{ text: "Download", href: "\/downloads\/", variant: "primary" \}/);
  assert.doesNotMatch(landing, /text: "Download"[^\n]*platformDownload/);
});

test('landing code example offers a Learn playground handoff', async () => {
  const codeWindow = await readWebsiteFile('src/components/LandingCodeWindow.astro');

  assert.match(codeWindow, /Try in playground/);
  assert.match(codeWindow, /learn\.beskid-lang\.org\/\?code=/);
});

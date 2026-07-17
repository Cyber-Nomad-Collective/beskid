import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { blogStatusLabel, sortBlogEntries } from './blog.ts';

test('orders newest posts first and labels publication state', () => {
	const posts = [
		{ data: { date: new Date('2026-03-05'), blogStatus: 'released' } },
		{ data: { date: new Date('2026-07-16'), blogStatus: 'in-progress' } },
		{ data: { date: new Date('2026-05-25'), blogStatus: 'truncated' } },
	];

	assert.deepEqual(
		sortBlogEntries(posts).map((post) => post.data.blogStatus),
		['in-progress', 'truncated', 'released'],
	);
	assert.equal(blogStatusLabel('truncated'), 'Truncated delivery band');
});

test('provides a reduced-motion-safe blog index that uses the shared blog helpers', async () => {
	const here = new URL('.', import.meta.url);
	const indexPath = new URL('../content/docs/blog/index.mdx', here);
	const componentPath = new URL('../components/ReleaseBlogIndex.astro', here);
	const contentConfigPath = new URL('../content.config.ts', here);

	await access(fileURLToPath(indexPath), constants.F_OK);
	await access(fileURLToPath(componentPath), constants.F_OK);

	const [index, component, contentConfig] = await Promise.all([
		readFile(indexPath, 'utf8'),
		readFile(componentPath, 'utf8'),
		readFile(contentConfigPath, 'utf8'),
	]);

	assert.match(index, /ReleaseBlogIndex/);
	assert.match(component, /sortBlogEntries/);
	assert.match(component, /blogStatusLabel/);
	assert.match(component, /entry\.data\.date !== undefined/);
	assert.match(component, /prefers-reduced-motion:\s*reduce/);
	assert.match(contentConfig, /date:\s*z\.coerce\.date\(\)/);
});

test('surfaces the release blog from the landing page', async () => {
	const here = new URL('.', import.meta.url);
	const landingPath = new URL('../content/docs/index.mdx', here);
	const landing = await readFile(landingPath, 'utf8');

	assert.match(landing, /text: "Release blog"/);
	assert.match(landing, /href: "\/blog\/"/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';

const root = new URL('../../../../', import.meta.url);

const procedurePages = [
	{ path: 'docs/index.md', diagram: 'Audience routing' },
	{ path: 'docs/getting-started/index.md', noDiagram: 'This short route delegates decisions to the detailed task pages.' },
	{ path: 'docs/getting-started/install.md', diagram: 'Install decision' },
	{ path: 'docs/getting-started/first-program.md', diagram: 'Source to AOT execution' },
	{ path: 'docs/getting-started/editor.md', diagram: 'Editor and language server' },
	{ path: 'docs/getting-started/troubleshooting.md', diagram: 'First-day troubleshooting' },
	{ path: 'docs/tooling/index.md', diagram: 'CLI taxonomy' },
	{ path: 'docs/tooling/build-run-test.md', noDiagram: 'The numbered build, run, and test procedure is already linear.' },
	{ path: 'docs/tooling/ci.md', diagram: 'Reproducible CI' },
	{ path: 'docs/language-basics/index.md', noDiagram: 'A syntax reference table is clearer than a flow diagram.' },
];

function splitDocument(source, filePath) {
	const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	assert.ok(match, `${filePath} must start with YAML frontmatter`);
	return { data: parse(match[1]), body: match[2] };
}

async function loadPage(page) {
	const filePath = new URL(`../content/docs/${page.path}`, import.meta.url);
	let source;
	try {
		source = await readFile(filePath, 'utf8');
	} catch (error) {
		if (error?.code === 'ENOENT') {
			assert.fail(`${page.path} must exist`);
		}
		throw error;
	}
	return { ...page, filePath: filePath.pathname, ...splitDocument(source, filePath.pathname) };
}

test('task pages provide complete executable procedures', async () => {
	for (const page of await Promise.all(procedurePages.map(loadPage))) {
		for (const heading of ['Prerequisites', 'Actions', 'Expected result', 'Recovery', 'Next task']) {
			assert.match(page.body, new RegExp(`^## ${heading}$`, 'm'), `${page.path} must contain ${heading}`);
		}
		assert.match(page.body, /^## Actions\n\n1\.\s/m, `${page.path} actions must be a numbered procedure`);
		assert.match(page.body, /^## Expected result\n\n\S/m, `${page.path} must state an observable result`);
		assert.match(page.body, /^## Recovery\n\n\S/m, `${page.path} must give a recovery action`);
		assert.match(page.body, /^## Next task\n\n\S/m, `${page.path} must link a next task`);

		assert.ok(Array.isArray(page.data.audience) && page.data.audience.length > 0, `${page.path} must name its audience`);
		assert.equal(typeof page.data.description, 'string', `${page.path} must have a description`);
		assert.equal(typeof page.data.authority?.status, 'string', `${page.path} must have authority status`);
		assert.equal(typeof page.data.authority?.sourceLabel, 'string', `${page.path} must name its source`);
		assert.equal(typeof page.data.authority?.sourceHref, 'string', `${page.path} must link its source`);
		assert.equal(typeof page.data.authority?.limits, 'string', `${page.path} must state its limits`);
		assert.match(page.data.verified?.revision ?? '', /^[0-9a-f]{40}$/, `${page.path} must name a verified revision`);
		assert.match(String(page.data.verified?.date ?? ''), /^2026-09-08$/, `${page.path} must name its verification date`);
	}
});

test('procedure diagrams are accessible and have a following text equivalent', async () => {
	for (const page of await Promise.all(procedurePages.map(loadPage))) {
		if (page.diagram) {
			const mermaidAt = page.body.indexOf('```mermaid');
			const textAt = page.body.indexOf('### Diagram text');
			assert.notEqual(mermaidAt, -1, `${page.path} must contain its ${page.diagram} diagram`);
			assert.match(page.body, /accTitle:\s*[^\n]+/, `${page.path} diagram must have an accessible title`);
			assert.match(page.body, /accDescr:\s*[^\n]+/, `${page.path} diagram must have an accessible description`);
			assert.ok(textAt > mermaidAt, `${page.path} text equivalent must follow its diagram`);
		} else {
			assert.ok(page.noDiagram, `${page.path} must record why a diagram is not useful`);
			assert.doesNotMatch(page.body, /```mermaid/, `${page.path} must remain diagram-free while the rationale applies`);
		}
	}
});

test('active procedures use current project, entrypoint, and AOT terminology', async () => {
	for (const page of await Promise.all(procedurePages.map(loadPage))) {
		assert.doesNotMatch(page.body, /\b(?:Project|Workspace)\.proj\b|(?<!b)\.proj\b/, `${page.path} must not use a retired manifest name`);
		assert.doesNotMatch(page.body, /\b(?:i32|unit)\s+main\s*\(/, `${page.path} must use the Main entrypoint`);
		assert.doesNotMatch(page.body, /(?:beskid\s+run[^\n.]*\bJIT\b|\bJIT\b[^\n.]*beskid\s+run)/i, `${page.path} must describe beskid run as AOT`);
	}
});

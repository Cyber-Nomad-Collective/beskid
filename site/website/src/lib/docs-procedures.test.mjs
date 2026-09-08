import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';

const root = new URL('../../../../', import.meta.url);

const procedurePages = [
	{
		path: 'docs/index.md',
		diagram: 'Audience routing',
		diagramBranches: ['Evaluate or start', 'Develop', 'Publish', 'Operate', 'Contribute'],
		equivalentConcepts: ['Get started', 'Tooling', 'Packages', 'Operate', 'Documentation authoring'],
		sections: {
			prerequisites: ['result that you want', 'evaluate the documentation'],
			actions: ['Select your role', 'verification revision'],
			expectedResult: ['audience', 'authority annotation'],
			recovery: ['follow the standard', 'documentation mismatch'],
		},
	},
	{
		path: 'docs/getting-started/index.md',
		noDiagram: 'This short route delegates decisions to the detailed task pages.',
		sections: {
			prerequisites: ['supported host', 'user-local program'],
			actions: ['/docs/getting-started/install/', '/docs/getting-started/editor/'],
			expectedResult: ['beskid --version', 'beskid run Main.bd --plain'],
			recovery: ['first failed check', 'analysis error'],
		},
	},
	{
		path: 'docs/getting-started/install.md',
		diagram: 'Install decision',
		diagramBranches: ['Artifact is listed?', 'Use stable', 'Use displayed unstable', 'Use immutable tag'],
		equivalentConcepts: ['stable', 'unstable', 'immutable tag', 'language server'],
		sections: {
			prerequisites: ['Linux AMD64', 'older Beskid installation'],
			actions: ['export PATH="$HOME/.beskid/bin:$PATH"', 'beskid lsp install'],
			expectedResult: ['host-target', 'matching LSP'],
			recovery: ['active shell profile', 'selected CLI tag'],
		},
	},
	{
		path: 'docs/getting-started/first-program.md',
		diagram: 'Source to AOT execution',
		diagramBranches: ['Resolve and analyze', 'AOT compile', 'Link runtime kit', 'Run subprocess'],
		equivalentConcepts: ['Main.bd', 'native object code', 'runtime kit', 'subprocess'],
		sections: {
			prerequisites: ['/docs/getting-started/install/', 'empty directory'],
			actions: ['i32 Main()', 'beskid analyze Main.bd --plain'],
			expectedResult: ['status `0`', 'error diagnostic'],
			recovery: ['default entrypoint `Main`', 'runtime kit'],
		},
	},
	{
		path: 'docs/getting-started/editor.md',
		diagram: 'Editor and language server',
		diagramBranches: ['Explicit path', 'Managed binary', 'Bundled binary', 'CLI-backed server', 'Automatic bootstrap', 'Compiler workspace'],
		equivalentConcepts: ['explicit path', 'managed binary', 'bundled binary', 'CLI-backed server', 'automatic bootstrap', 'compiler-workspace fallback'],
		sections: {
			prerequisites: ['/docs/getting-started/install/', '`Main.bd`'],
			actions: ['beskid.lsp.server.path', 'Problems panel'],
			expectedResult: ['diagnostic', 'language-server process'],
			recovery: ['<selected-lsp-tag>', 'selected CLI'],
		},
	},
	{
		path: 'docs/getting-started/troubleshooting.md',
		diagram: 'First-day troubleshooting',
		diagramBranches: ['Command missing', 'Wrong version or host', 'Source diagnostic', 'Link failure', 'No editor diagnostics'],
		equivalentConcepts: ['PATH', 'exact host artifact', 'source span', 'runtime kit', 'language server'],
		sections: {
			prerequisites: ['complete output', 'beskid --version'],
			actions: ['beskid up host-target', 'beskid analyze Main.bd --plain'],
			expectedResult: ['previously failing check', 'earlier check'],
			recovery: ['selected release tag', 'private source code'],
		},
	},
	{
		path: 'docs/tooling/index.md',
		diagram: 'CLI taxonomy',
		diagramBranches: ['Syntax', 'Build', 'Project', 'Package'],
		equivalentConcepts: ['Syntax commands', 'Build commands', 'Project commands', 'Package commands'],
		sections: {
			prerequisites: ['beskid --help', 'source or project directory'],
			actions: ['beskid dev syntax', 'beskid dev package'],
			expectedResult: ['selected command help', 'grouped forms'],
			recovery: ['beskid --help', 'concise root command'],
		},
	},
	{
		path: 'docs/tooling/build-run-test.md',
		noDiagram: 'The numbered build, run, and test procedure is already linear.',
		sections: {
			prerequisites: ['beskid analyze', '`.bproj` manifest'],
			actions: ['beskid build Main.bd --kind exe --plain', 'beskid test --project App.bproj'],
			expectedResult: ['subprocess status', 'passed, failed, skipped, and filtered'],
			recovery: ['target-selection error', 'runtime-kit error'],
		},
	},
	{
		path: 'docs/tooling/ci.md',
		diagram: 'Reproducible CI',
		diagramBranches: ['Pinned toolchain', 'Format check', 'Frozen analyze', 'Frozen tests', 'Frozen release build', 'Publish artifact'],
		equivalentConcepts: ['immutable toolchain', 'formatting', '--frozen', 'Publish'],
		sections: {
			prerequisites: ['Project.lock', 'CI secret store'],
			actions: ['beskid format Src --check', '--all-targets --frozen --plain --json'],
			expectedResult: ['same toolchain and lockfile', 'native release artifact'],
			recovery: ['update and review `Project.lock`', 'do not publish'],
		},
	},
	{
		path: 'docs/language-basics/index.md',
		noDiagram: 'A syntax reference table is clearer than a flow diagram.',
		sections: {
			prerequisites: ['`Main.bd`', '/docs/getting-started/first-program/'],
			actions: ['i32 Main()', '/docs/standard/'],
			expectedResult: ['return type', 'statement terminator'],
			recovery: ['diagnostic span', 'semicolon'],
		},
	},
];

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function section(body, heading) {
	const marker = `## ${heading}\n\n`;
	const start = body.indexOf(marker);
	if (start === -1) return '';
	const contentStart = start + marker.length;
	const nextHeading = body.indexOf('\n## ', contentStart);
	return body.slice(contentStart, nextHeading === -1 ? undefined : nextHeading).trim();
}

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
			const content = section(page.body, heading);
			assert.ok(content.length > 0, `${page.path} must contain non-empty ${heading}`);
		}
		const steps = [...section(page.body, 'Actions').matchAll(/^(\d+)\.\s+(.+)$/gm)];
		assert.ok(steps.length >= 2, `${page.path} must contain at least two numbered actions`);
		assert.equal(new Set(steps.map((step) => step[2])).size, steps.length, `${page.path} actions must be distinct`);
		for (const [, , action] of steps) {
			assert.ok(action.trim().length >= 12, `${page.path} numbered actions must contain substantive text`);
		}
		assert.match(section(page.body, 'Actions'), /`[^`]+`|\[[^\]]+\]\([^)]+\)|```[a-z]*\n/i, `${page.path} actions must include a command, link, or configuration token`);
		assert.match(section(page.body, 'Next task'), /\[[^\]]+\]\(\/[^)]+\)/, `${page.path} next task must contain an internal Markdown link`);
		for (const [heading, key] of [
			['Prerequisites', 'prerequisites'],
			['Actions', 'actions'],
			['Expected result', 'expectedResult'],
			['Recovery', 'recovery'],
		]) {
			assert.ok(page.sections[key].length >= 2, `${page.path} must define meaningful ${heading} expectations`);
			const content = section(page.body, heading);
			for (const concept of page.sections[key]) {
				assert.ok(content.includes(concept), `${page.path} ${heading} must explain ${concept}`);
			}
		}

		assert.ok(Array.isArray(page.data.audience) && page.data.audience.length > 0, `${page.path} must name its audience`);
		for (const [field, value] of [
			['description', page.data.description],
			['authority.status', page.data.authority?.status],
			['authority.sourceLabel', page.data.authority?.sourceLabel],
			['authority.sourceHref', page.data.authority?.sourceHref],
			['authority.limits', page.data.authority?.limits],
		]) {
			assert.ok(typeof value === 'string' && value.trim().length > 0, `${page.path} must define non-empty ${field}`);
		}
		assert.match(page.data.verified?.revision ?? '', /^[0-9a-f]{40}$/, `${page.path} must name a verified revision`);
		assert.match(String(page.data.verified?.date ?? ''), /^2026-09-08$/, `${page.path} must name its verification date`);
	}
});

test('procedure diagrams are accessible and have a following text equivalent', async () => {
	for (const page of await Promise.all(procedurePages.map(loadPage))) {
		if (page.diagram) {
			const match = page.body.match(/```mermaid\n([\s\S]*?)\n```\s*\n### Diagram text\n\n([\s\S]*?)(?=\n## |$)/);
			assert.ok(match, `${page.path} Diagram text must immediately follow its Mermaid fence`);
			const [, diagram, equivalent] = match;
			assert.match(diagram, new RegExp(`^\\s*accTitle:\\s*${escapeRegExp(page.diagram)}\\s*$`, 'm'), `${page.path} must use the expected accessible title`);
			assert.match(diagram, /^\s*accDescr:\s*\S.+$/m, `${page.path} diagram must have an accessible description`);
			const description = diagram.match(/^\s*accDescr:\s*(.+)$/m)[1];
			for (const sentence of description.split(/(?<=[.!?])\s+/)) {
				assert.ok(sentence.trim().split(/\s+/).length <= 25, `${page.path} diagram descriptions must use short sentences`);
			}
			assert.ok(equivalent.trim().length >= 80, `${page.path} must provide a nontrivial text equivalent`);
			for (const branch of page.diagramBranches) {
				assert.ok(diagram.includes(branch), `${page.path} diagram must show ${branch}`);
			}
			for (const concept of page.equivalentConcepts) {
				assert.ok(equivalent.includes(concept), `${page.path} text equivalent must explain ${concept}`);
			}
		} else {
			assert.ok(page.noDiagram, `${page.path} must record why a diagram is not useful`);
			assert.doesNotMatch(page.body, /```mermaid/, `${page.path} must remain diagram-free while the rationale applies`);
		}
	}
});

test('installation guidance aligns PATH and CLI/LSP release channels', async () => {
	const install = await loadPage(procedurePages.find((page) => page.path.endsWith('/install.md')));
	assert.match(install.body, /POSIX installer[^.]*prints[^.]*PATH/i);
	assert.ok(install.body.includes('export PATH="$HOME/.beskid/bin:$PATH"'));
	assert.match(install.body, /shell profile/i);
	assert.match(install.body, /Windows installer[\s\S]{0,160}user `PATH`/i);
	for (const pair of [['cli-stable', 'lsp-stable'], ['cli-unstable', 'lsp-unstable'], ['cli-v0.4.0', 'lsp-v0.4.0']]) {
		const [cli, lsp] = pair;
		assert.match(install.body, new RegExp(`${escapeRegExp(cli)}[^\\n]{0,160}${escapeRegExp(lsp)}`), `${cli} must align with ${lsp}`);
	}
	assert.ok(install.body.includes('They do not guarantee binary compatibility.'));
});

test('tooling distinguishes AOT commands from the test execution engine', async () => {
	const tooling = await loadPage(procedurePages.find((page) => page.path === 'docs/tooling/index.md'));
	assert.ok(tooling.body.includes('Only `beskid build` and `beskid run` use the AOT pipeline.'));
	assert.match(tooling.body, /`beskid test` uses the current test execution engine/);
	assert.doesNotMatch(tooling.body, /`beskid build`, `beskid run`, or `beskid test` for AOT/);
});

test('CI uses the case-sensitive manifest source root', async () => {
	const ci = await loadPage(procedurePages.find((page) => page.path === 'docs/tooling/ci.md'));
	assert.ok(ci.body.includes('beskid format Src --check'));
	assert.match(ci.body, /manifest declares a different source root/i);
});

test('editor guidance uses pinned extension provenance', async () => {
	const editor = await loadPage(procedurePages.find((page) => page.path.endsWith('/editor.md')));
	assert.equal(editor.data.authority.sourceHref, 'https://github.com/Cyber-Nomad-Collective/beskid_vscode/blob/94640e47f3292a883cb2f92c4a04321f8724a3f7/package.json');
	assert.equal(editor.data.verified.revision, '94640e47f3292a883cb2f92c4a04321f8724a3f7');
});

test('editor recovery follows the selected CLI and LSP release pair', async () => {
	const editor = await loadPage(procedurePages.find((page) => page.path.endsWith('/editor.md')));
	const recovery = section(editor.body, 'Recovery');
	assert.ok(recovery.includes('beskid lsp install --release-tag <selected-lsp-tag>'));
	assert.match(recovery, /tag that corresponds to the selected CLI (?:channel|immutable version)/i);
	assert.doesNotMatch(recovery, /--release-tag\s+lsp-stable\b/, 'editor recovery must not force the stable LSP channel');
});

test('active procedures use current project, entrypoint, and AOT terminology', async () => {
	for (const page of await Promise.all(procedurePages.map(loadPage))) {
		assert.doesNotMatch(page.body, /\b(?:Project|Workspace)\.proj\b|(?<!b)\.proj\b/, `${page.path} must not use a retired manifest name`);
		assert.doesNotMatch(page.body, /\b(?:i32|unit)\s+main\s*\(/, `${page.path} must use the Main entrypoint`);
		assert.doesNotMatch(page.body, /(?:beskid\s+run[^\n.]*\bJIT\b|\bJIT\b[^\n.]*beskid\s+run)/i, `${page.path} must describe beskid run as AOT`);
	}
});

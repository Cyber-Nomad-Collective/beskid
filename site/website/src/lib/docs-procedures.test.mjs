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
	{
		path: 'docs/projects/index.md',
		diagram: 'Workspace project dependency graph',
		diagramBranches: ['Workspace.bws', 'App.bproj', 'Core.bproj', 'registry package', 'Project.lock', 'obj/beskid/deps/src/materialized-id'],
		equivalentConcepts: ['workspace manifest', 'project manifest', 'path dependency', 'registry version', 'Project.lock', 'materialized dependency'],
		sections: {
			prerequisites: ['beskid --version', '`.bproj`'],
			actions: ['/docs/projects/create/', '/docs/projects/dependencies-and-locks/'],
			expectedResult: ['one selected project', 'reviewed and committed `Project.lock`'],
			recovery: ['multiple `.bproj`', '--project'],
		},
	},
	{
		path: 'docs/projects/create.md',
		noDiagram: 'The project creation procedure is a short linear scaffold-and-check sequence.',
		sections: {
			prerequisites: ['installed `console` template', 'empty output directory'],
			actions: ['beskid new console -n MyApp -o ./MyApp --no-interactive', 'beskid analyze --project "$project_manifest" --target "$target_name" --plain'],
			expectedResult: ['Created template output at', 'exactly one `.bproj`'],
			recovery: ['beskid new list', '--force'],
		},
	},
	{
		path: 'docs/projects/workspaces.md',
		noDiagram: 'The Projects overview already shows the workspace and member relationships.',
		sections: {
			prerequisites: ['two project directories', 'one `.bproj`'],
			actions: ['member "app"', 'beskid analyze ./app/Src/Main.bd --project ./Workspace.bws'],
			expectedResult: ['deepest matching member', 'no input path'],
			recovery: ['multiple `.bws`', '--workspace-member'],
		},
	},
	{
		path: 'docs/projects/dependencies-and-locks.md',
		noDiagram: 'The Projects overview already shows the dependency graph; this page is an ordered lockfile procedure.',
		sections: {
			prerequisites: ['Project.lock', 'registry access'],
			actions: ['source = "path"', 'source = "registry"', 'beskid fetch --project ./App.bproj --locked --plain', 'beskid fetch --project ./App.bproj --frozen --plain'],
			expectedResult: ['obj/beskid/deps/src/<materialized-id>', '`.generated`'],
			recovery: ['beskid lock --project ./App.bproj --plain', 'does not materialize Git dependencies', 'implementation limitation under reconciliation'],
		},
	},
	{
		path: 'docs/packages/index.md',
		diagram: 'Package publication and consumption',
		diagramBranches: ['Author', 'Registry', 'Consumer', 'Create package record', 'Upload .bpk', 'Request version', 'Fallback first active', 'Materialize dependency'],
		equivalentConcepts: ['package author', 'package record', 'immutable', 'package consumer', 'Project.lock', 'yanked'],
		sections: {
			prerequisites: ['publisher API key', 'package name'],
			actions: ['/docs/packages/publish/', '/docs/packages/consume/'],
			expectedResult: ['immutable name-and-version coordinate', 'reviewed `Project.lock`'],
			recovery: ['/docs/packages/credentials-and-recovery/', 'do not upload', 'resolver can fall back'],
		},
	},
	{
		path: 'docs/packages/publish.md',
		noDiagram: 'The Packages overview already shows the publication and consumption sequence.',
		sections: {
			prerequisites: ['BESKID_PCKG_API_KEY', 'publisher permission'],
			actions: ['POST /api/packages', 'beskid pckg pack --package Acme.Math', 'unzip -p', 'beskid pckg upload Acme.Math'],
			expectedResult: ['.beskid/docs/api.json', 'Published Acme.Math@1.0.0'],
			recovery: ['package already exists', 'package version is immutable'],
		},
	},
	{
		path: 'docs/packages/consume.md',
		noDiagram: 'The manifest edit and fetch procedure is linear, and the Packages overview shows the participants.',
		sections: {
			prerequisites: ['package name', 'requested version'],
			actions: ['beskid pckg details Acme.Math', 'beskid pckg download Acme.Math --version 1.0.0', 'beskid fetch --project ./App.bproj --locked --plain'],
			expectedResult: ['resolved_version', 'obj/beskid/deps/src/<materialized-id>'],
			recovery: ['beskid pckg versions Acme.Math', 'yanked', 'stop the workflow'],
		},
	},
	{
		path: 'docs/packages/credentials-and-recovery.md',
		noDiagram: 'A symptom-to-command recovery table is clearer than a flow diagram.',
		sections: {
			prerequisites: ['secret manager', 'publish scope'],
			actions: ['beskid pckg configure', 'beskid pckg whoami', 'beskid pckg yank Acme.Math --version 1.0.0', 'beskid pckg unyank Acme.Math --version 1.0.0'],
			expectedResult: ['authenticated=true', 'version yanked'],
			recovery: ['revoke', 'rotate'],
		},
	},
	{
		path: 'docs/services/index.md',
		diagram: 'Public service and authentication topology',
		diagramBranches: ['Website', 'Auth hub', 'Learn', 'pckg', 'Tracker', 'Nexus'],
		equivalentConcepts: ['public guidance', 'GitHub OAuth', 'learning checks', 'package artifacts', 'delivery status', 'repository graph'],
		sections: {
			prerequisites: ['service task', 'public service status'],
			actions: ['/docs/services/authentication/', '/docs/operations/health-and-monitoring/'],
			expectedResult: ['service boundary', 'authentication boundary'],
			recovery: ['health endpoint', 'service operator'],
		},
	},
	...[
		['docs/services/authentication.md', 'GitHub OAuth', 'AUTH_HUB_PUBLIC_URL', 'pairing code', 'service token'],
		['docs/services/learn.md', 'interactive learning', 'BESKID_BINARY', '/api/health', 'temporary workspace'],
		['docs/services/pckg.md', 'package registry', 'PCKG_DATABASE_URL', '/health/ready', 'PostgreSQL'],
		['docs/services/tracker.md', 'delivery authority', 'TRACKER_DATA_DIR', '/api/health', 'SQLite'],
		['docs/services/nexus.md', 'repository graph', 'GITNEXUS_HOME', '/api/health', 'forward-auth'],
	].map(([path, purpose, setting, health, state]) => ({
		path,
		noDiagram: 'The service contract table is clearer than a diagram for one service.',
		sections: {
			prerequisites: [purpose, setting],
			actions: [health, 'service contract'],
			expectedResult: [health, state],
			recovery: ['restore', 'redeploy'],
		},
	})),
	{
		path: 'docs/operations/index.md',
		noDiagram: 'The ordered operator checklist is clearer than a second platform diagram.',
		sections: {
			prerequisites: ['Coolify lane', 'OpenBao token'],
			actions: ['/docs/operations/containers/', '/docs/operations/deployment/'],
			expectedResult: ['immutable image digests', 'healthy services'],
			recovery: ['CI stops and reports', 'production operator'],
		},
	},
	{
		path: 'docs/operations/containers.md',
		noDiagram: 'The container matrix gives a more precise comparison than a diagram.',
		sections: {
			prerequisites: ['container engine', 'pinned Compose contract'],
			actions: ['docker compose', 'persistent volumes'],
			expectedResult: ['healthy', 'immutable digest'],
			recovery: ['container logs', 'do not delete'],
		},
	},
	{
		path: 'docs/operations/deployment.md',
		noDiagram: 'The numbered promotion and rollback procedure is already linear.',
		sections: {
			prerequisites: ['protected GitHub environment', 'lane-scoped'],
			actions: ['just seed-openbao-check', 'reusable-promote.yml'],
			expectedResult: ['checksummed release manifest', 'Watchtower'],
			recovery: ['production operator', 'no authority'],
		},
	},
	{
		path: 'docs/operations/health-and-monitoring.md',
		noDiagram: 'The endpoint and symptom matrix is clearer than a flow diagram.',
		sections: {
			prerequisites: ['expected image identity', 'monitoring access'],
			actions: ['/api/v1/health', '/health/ready'],
			expectedResult: ['successful HTTP status', 'deployment window'],
			recovery: ['correlation evidence', 'production operator'],
		},
	},
	{
		path: 'docs/contributing/index.md',
		noDiagram: 'The contributor task list is a short route to detailed procedures.',
		sections: {
			prerequisites: ['repository change', 'ownership boundary'],
			actions: ['/docs/contributing/repository/', '/docs/contributing/standard-changes/'],
			expectedResult: ['focused gate', 'correct authority'],
			recovery: ['unrelated changes', 'source owner'],
		},
	},
	{
		path: 'docs/contributing/repository.md',
		noDiagram: 'The checkout and focused-gate procedure is a linear sequence.',
		sections: {
			prerequisites: ['repository checkout', 'pnpm'],
			actions: ['./scripts/setup-environment.sh', 'pnpm --dir site/website test'],
			expectedResult: ['pinned submodule commits', 'focused gate'],
			recovery: ['submodule owner', 'unrelated dirty state'],
		},
	},
	{
		path: 'docs/contributing/standard-changes.md',
		diagram: 'OpenSpec authority and publication flow',
		diagramBranches: ['OpenSpec change', 'Strict validation', 'Canonical specification', 'Catalog projection', 'Docs summary'],
		equivalentConcepts: ['proposal', 'SHALL', 'GIVEN', 'catalog', 'informative'],
		sections: {
			prerequisites: ['observable behavior', 'capability identifier'],
			actions: ['openspec validate', 'pnpm run openspec:validate'],
			expectedResult: ['SHALL or MUST', 'GIVEN, WHEN, and THEN'],
			recovery: ['do not change Docs', 'validation error'],
		},
	},
	{
		path: 'docs/reference/index.md',
		noDiagram: 'The authority table is clearer than a flow diagram for reference selection.',
		sections: {
			prerequisites: ['fact to verify', 'authority type'],
			actions: ['/docs/standard/', '/docs/reference/licensing/'],
			expectedResult: ['canonical source', 'verification revision'],
			recovery: ['conflicting sources', 'do not infer'],
		},
	},
	{
		path: 'docs/reference/licensing.md',
		noDiagram: 'The component license matrix is clearer than a relationship diagram.',
		sections: {
			prerequisites: ['component path', 'more specific license'],
			actions: ['LICENSING.md', 'pnpm licenses:check'],
			expectedResult: ['Apache-2.0', 'AGPL-3.0-only'],
			recovery: ['third-party notice', 'do not distribute'],
		},
	},
];

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsPckgSubcommand(commandText, subcommand) {
	const valueOption = '--(?:base-url|bearer-token|api-key|timeout-secs|config-file)(?:=\\S+|\\s+\\S+)';
	const flagOption = '(?:--verbose|-v)';
	return new RegExp(
		`(?:^|\\n)\\s*(?:\\$|PS>|>)?\\s*beskid\\s+pckg\\s+(?:(?:${valueOption}|${flagOption})\\s+)*${escapeRegExp(subcommand)}\\b`,
	).test(commandText);
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

test('package procedures use real pckg commands and one grouped-alias explanation', async () => {
	const packagePages = await Promise.all(procedurePages.filter((page) => page.path.startsWith('docs/packages/')).map(loadPage));
	const combined = packagePages.map((page) => page.body).join('\n');
	assert.ok(combined.includes('beskid pckg'));
	assert.equal(combined.match(/beskid dev package registry/g)?.length, 1, 'the grouped package alias must be explained once');
	for (const page of packagePages) {
		const commands = [...page.body.matchAll(/```(?:bash|sh|shell)\n([\s\S]*?)\n```/g)].map((match) => match[1]).join('\n');
		for (const command of ['login', 'dry-run', 'publish']) {
			assert.equal(containsPckgSubcommand(commands, command), false, `${page.path} must not teach nonexistent beskid pckg ${command}`);
		}
	}
});

test('pckg command validation catches prompts and intervening global flags', () => {
	for (const [sample, subcommand] of [
		['$ beskid pckg login', 'login'],
		['PS> beskid pckg --verbose publish', 'publish'],
		['> beskid pckg --base-url https://registry.example dry-run', 'dry-run'],
	]) {
		assert.equal(containsPckgSubcommand(sample, subcommand), true, `must detect ${sample}`);
	}
});

test('registry procedures expose version fallback and require lock inspection', async () => {
	const paths = [
		'docs/projects/dependencies-and-locks.md',
		'docs/packages/index.md',
		'docs/packages/consume.md',
	];
	const pages = await Promise.all(paths.map((path) => loadPage(procedurePages.find((page) => page.path === path))));
	const combined = pages.map((page) => page.body).join('\n');
	assert.ok(combined.includes('implementation limitation under reconciliation'));
	assert.ok(combined.includes('resolver can fall back to the first active version'));
	assert.ok(combined.includes('Inspect `Project.lock` after every registry resolution'));
	assert.ok(combined.includes('stop the workflow if `resolved_version` differs from the requested version'));
	assert.doesNotMatch(combined, /registry resolution (?:selects|records|downloads)[^.]*exact version/i);
	assert.doesNotMatch(combined, /locked resolution selects the same coordinate/i);
});

test('workspace guidance distinguishes source-path and no-input selection and explains target defaults', async () => {
	const workspace = await loadPage(procedurePages.find((page) => page.path === 'docs/projects/workspaces.md'));
	assert.ok(workspace.body.includes('beskid analyze ./app/Src/Main.bd --project ./Workspace.bws'));
	assert.match(workspace.body, /source path[\s\S]*deepest matching member/i);
	assert.match(workspace.body, /no input path[\s\S]*defaultTestMember[\s\S]*first declared member/i);
	assert.ok(workspace.body.includes('App, then Test, then Lib'));
	assert.match(workspace.body, /pass `--target`[^.]*more than one target/i);
});

test('package record creation keeps the bearer value off curl argv', async () => {
	const publish = await loadPage(procedurePages.find((page) => page.path === 'docs/packages/publish.md'));
	const credentials = await loadPage(procedurePages.find((page) => page.path === 'docs/packages/credentials-and-recovery.md'));
	assert.equal(credentials.data.authority.status, 'security-sensitive');
	const actions = section(publish.body, 'Actions');
	assert.match(actions, /printf[\s\S]*BESKID_PCKG_API_KEY[\s\S]*\|[\s\n]*curl[^\n]*--config -/);
	assert.doesNotMatch(actions, /curl[^\n]*BESKID_PCKG_API_KEY/);
});

test('service and operations guidance covers each public audience in navigation', async () => {
	const navigation = await readFile(new URL('../data/docs-navigation.ts', import.meta.url), 'utf8');
	for (const [audience, route, pagePath] of [
		['platform user', '/docs/services/', 'docs/services/index.md'],
		['self-hoster', '/docs/operations/', 'docs/operations/index.md'],
		['maintainer', '/docs/contributing/repository/', 'docs/contributing/repository.md'],
		['contributor', '/docs/contributing/', 'docs/contributing/index.md'],
		['evaluator', '/docs/reference/', 'docs/reference/index.md'],
	]) {
		assert.ok(navigation.includes(route), `${audience} must have a navigation entry at ${route}`);
		const page = await loadPage({ path: pagePath });
		assert.ok(page.data.audience.includes(audience), `${pagePath} must name ${audience} in frontmatter`);
	}
	for (const group of ['Operate', 'Contribute', 'Reference']) {
		assert.match(navigation, new RegExp(`label: '${group}'`), `navigation must contain the ${group} group`);
	}
});

test('Task 5 numbered steps contain one observable action', async () => {
	const task5Paths = procedurePages
		.map((page) => page.path)
		.filter((path) => /^docs\/(?:services|operations|reference)\//.test(path) || [
			'docs/contributing/index.md',
			'docs/contributing/repository.md',
			'docs/contributing/standard-changes.md',
		].includes(path));
	for (const path of task5Paths) {
		const page = await loadPage(procedurePages.find((candidate) => candidate.path === path));
		for (const [, , action] of section(page.body, 'Actions').matchAll(/^(\d+)\.\s+(.+)$/gm)) {
			const proseAction = action.replace(/`[^`]*`|\*\*[^*]*\*\*/g, 'reference');
			assert.doesNotMatch(
				proseAction,
				/(?:,\s*|;\s*|\s)(?:and|then)\s+(?:check|complete|confirm|contact|create|identify|inspect|open|record|redeploy|restore|run|select|use|verify|wait)\b/i,
				`${path} must split the multi-action step: ${action}`,
			);
			assert.equal((proseAction.match(/\.\s+(?:Check|Complete|Confirm|Create|Inspect|Open|Record|Run|Select|Use|Verify)\b/g) ?? []).length, 0, `${path} must not add a second imperative sentence in one step`);
		}
	}
});

test('service pages publish a complete verified operating contract', async () => {
	const servicePages = await Promise.all(procedurePages.filter((page) => /^docs\/services\/(?:authentication|learn|pckg|tracker|nexus)\.md$/.test(page.path)).map(loadPage));
	for (const page of servicePages) {
		const contract = section(page.body, 'Service contract');
		for (const field of ['Purpose', 'Audience', 'Public boundary', 'Local boundary', 'Authentication', 'Persistent state', 'Container image', 'Health check', 'Deployment owner', 'Secret source', 'Monitoring', 'Recovery']) {
			assert.ok(contract.includes(`| ${field} |`), `${page.path} must define ${field}`);
		}
		assert.match(contract, /ghcr\.io\/cyber-nomad-collective\/beskid-/);
	}
});

test('service contracts retain critical pinned facts and disclose auth conflicts', async () => {
	const expectations = {
		'docs/services/authentication.md': ['90c40a91fefa8150134663de120afcb1ef582f2a/site/auth/README.md', 'GitHub OAuth', '/api/v1/health', '8090', 'auth-data', 'beskid-auth'],
		'docs/services/learn.md': ['90c40a91fefa8150134663de120afcb1ef582f2a/site/learn/README.md', 'BESKID_BINARY', '/api/health', '80', 'no durable Learn volume', 'beskid-learn'],
		'docs/services/pckg.md': ['beskid_pckg/blob/a490c7c7aa3fa7a7b28245e0c7564849d36eb19c/README.md', '/health/ready', '8082', 'PostgreSQL', 'pckg_packages', 'beskid-pckg', 'trusted forward-auth boundary'],
		'docs/services/tracker.md': ['c7da5b60e70fe87b10b1b3cde7e91c39af32136a/README.md', '/api/health', '3000', 'SQLite', 'tracker-data', 'beskid-tracker', 'central Auth hub'],
		'docs/services/nexus.md': ['eb207de7985ea110c1c0ea7e23f89dd94a66583d/COOLIFY.md', '/api/health', '8452', 'nexus-data', 'beskid-nexus', 'Caddy', 'Authentik'],
	};
	for (const [path, facts] of Object.entries(expectations)) {
		const page = await loadPage(procedurePages.find((candidate) => candidate.path === path));
		const complete = `${page.data.authority.sourceHref}\n${page.data.verified.revision}\n${page.body}`;
		for (const fact of facts) assert.ok(complete.includes(fact), `${path} must preserve ${fact}`);
	}
	const pckg = await loadPage(procedurePages.find((page) => page.path === 'docs/services/pckg.md'));
	assert.equal(pckg.data.verified.revision, 'a490c7c7aa3fa7a7b28245e0c7564849d36eb19c');
	const topology = await loadPage(procedurePages.find((page) => page.path === 'docs/services/index.md'));
	assert.match(topology.body, /root Auth README/i);
	assert.match(topology.body, /conflicts with the pinned, service-owned contracts/i);
	assert.match(topology.body, /under reconciliation/i);
	assert.match(topology.body, /pckg[^.]*separate trusted forward-auth boundary/i);
	assert.match(topology.body, /Nexus[^.]*Caddy[^.]*Authentik/i);
});

test('security-sensitive procedures protect secrets before operator actions', async () => {
	for (const path of ['docs/services/authentication.md', 'docs/operations/index.md', 'docs/operations/deployment.md', 'docs/packages/credentials-and-recovery.md']) {
		const page = await loadPage(procedurePages.find((candidate) => candidate.path === path));
		assert.equal(page.data.authority.status, 'security-sensitive', `${path} must use a security-sensitive annotation`);
		const beforeActions = page.body.slice(0, page.body.indexOf('\n## Actions'));
		assert.match(beforeActions, /secret manager|OpenBao/i, `${path} must explain secret storage before actions`);
		assert.match(beforeActions, /do not (?:print|commit|copy|put|store|expose)/i, `${path} must prohibit unsafe secret handling before actions`);
	}
});

test('repository setup is separate from end-user installation and uses pnpm', async () => {
	const repository = await loadPage(procedurePages.find((page) => page.path === 'docs/contributing/repository.md'));
	assert.match(repository.body, /does not install Beskid for an end user/i);
	assert.ok(repository.body.includes('./scripts/setup-environment.sh'));
	assert.match(repository.body, /pnpm --dir site\/website/);
	assert.match(repository.body, /submodule owner/i);
	assert.ok(repository.body.includes('site/website/src/content/docs/'));
	assert.match(repository.body, /do not edit generated output/i);
});

test('standard changes preserve the OpenSpec-to-Docs authority boundary', async () => {
	const standard = await loadPage(procedurePages.find((page) => page.path === 'docs/contributing/standard-changes.md'));
	assert.equal(standard.data.authority.status, 'informative');
	assert.match(standard.body, /OpenSpec is the sole normative authority/);
	assert.match(standard.body, /SHALL or MUST/);
	assert.match(standard.body, /GIVEN, WHEN, and THEN/);
	assert.match(standard.body, /openspec\/catalog\.json/);
	assert.match(standard.body, /Docs (?:is|are) informative/);
});

test('deployment guidance distinguishes verification from production control', async () => {
	const deployment = await loadPage(procedurePages.find((page) => page.path === 'docs/operations/deployment.md'));
	for (const fact of ['checksummed release manifest', 'signing workflow signs the images separately', 'reusable-promote.yml', 'Watchtower', 'cannot start, replace, or roll back production containers', 'under reconciliation']) {
		assert.ok(deployment.body.includes(fact), `deployment guidance must explain ${fact}`);
	}
	assert.doesNotMatch(deployment.body, /signed release manifest|deployment path must restore/i);
	const health = await loadPage(procedurePages.find((page) => page.path === 'docs/operations/health-and-monitoring.md'));
	assert.doesNotMatch(health.body, /same release manifest|health response[^.]*manifest identity/i);
	assert.match(health.body, /health handler[^.]*does not expose[^.]*manifest identity/i);
	assert.match(health.body, /separate release and deployment evidence/i);
});

test('operator recovery and delivery steps stay within available ownership and evidence', async () => {
	const operations = await loadPage(procedurePages.find((page) => page.path === 'docs/operations/index.md'));
	const recovery = section(operations.body, 'Recovery');
	assert.match(recovery, /CI stops and reports/);
	assert.match(recovery, /production operator owns (?:the )?(?:restore|rollback)/i);
	assert.match(recovery, /rerun (?:production )?verification/i);
	assert.doesNotMatch(recovery, /delivery path restore|CI[^.]*restore/i);

	const containers = await loadPage(procedurePages.find((page) => page.path === 'docs/operations/containers.md'));
	assert.match(section(containers.body, 'Next task'), /\[(?:Verify|Hand off)[^\]]*\]\(\/docs\/operations\/deployment\/\)/);
	assert.doesNotMatch(section(containers.body, 'Next task'), /Deploy the verified manifest/i);

	const deployment = await loadPage(procedurePages.find((page) => page.path === 'docs/operations/deployment.md'));
	const actions = section(deployment.body, 'Actions');
	assert.match(actions, /workflow (?:performs|owns) (?:the )?manifest (?:checksum )?validation/i);
	assert.match(actions, /record the workflow run URL/i);
	assert.match(actions, /record the (?:job )?status/i);
	assert.match(actions, /record (?:the )?(?:checksum|checksum evidence)/i);
	assert.doesNotMatch(actions, /release\/workflow-run\.json|release\/release-manifest\.json|validate-promotion-source\.sh/);
	assert.doesNotMatch(actions, /Select its checksummed release manifest|Materialize/i);
});

test('licensing reference reflects component boundaries and the Nexus exception', async () => {
	const licensing = await loadPage(procedurePages.find((page) => page.path === 'docs/reference/licensing.md'));
	for (const concept of ['Apache-2.0', 'AGPL-3.0-only', 'CC-BY-4.0', 'PolyForm Noncommercial License 1.0.0', 'Corresponding Source', 'compiled programs']) {
		assert.ok(licensing.body.includes(concept), `licensing guidance must explain ${concept}`);
	}
	assert.match(licensing.body, /more specific license[^.]*overrides/i);
});

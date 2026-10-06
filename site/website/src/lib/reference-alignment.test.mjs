import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const contentRoot = new URL('../content/docs/book/', import.meta.url);
const siteRoot = new URL('../../', import.meta.url);
const compilerRoot = process.env.BESKID_CLI_SOURCE_ROOT ?? fileURLToPath(new URL('../../../../compiler/', import.meta.url));
const snapshot = JSON.parse(await readFile(new URL('../data/pinned-cli-reference.json', import.meta.url), 'utf8'));
const scopedDirectories = [
	'reference/cli',
	'reference/projects',
	'01-it-works-on-my-machine',
	'02-path-not-found-tooling-anyway',
	'03-project-proj-or-it-didnt-happen',
	'06-monorepo-as-coping-mechanism',
	'14-from-source-to-runs',
	'15-mods-plugins-with-consequences',
	'18-packages-without-npm-trauma',
	'21-ffi-and-forbidden-friendships',
	'22-so-you-want-to-contribute',
];

const rootCommands = snapshot.commands.map(({ name }) => name);
const pinnedSourceFiles = [
	'crates/beskid_cli/src/cli.rs',
	'crates/beskid_cli/src/cli/app.rs',
	'crates/beskid_cli/src/cli/dev.rs',
	'crates/beskid_cli/src/cli/docs.rs',
	'crates/beskid_cli/src/project_args.rs',
	'crates/beskid_cli/src/commands/analyze.rs',
	'crates/beskid_cli/src/commands/build.rs',
	'crates/beskid_cli/src/commands/clif.rs',
	'crates/beskid_cli/src/commands/compiler_mod.rs',
	'crates/beskid_cli/src/commands/corelib.rs',
	'crates/beskid_cli/src/commands/dependency.rs',
	'crates/beskid_cli/src/commands/doc/model.rs',
	'crates/beskid_cli/src/commands/doctor.rs',
	'crates/beskid_cli/src/commands/fetch.rs',
	'crates/beskid_cli/src/commands/format.rs',
	'crates/beskid_cli/src/commands/graph.rs',
	'crates/beskid_cli/src/commands/import.rs',
	'crates/beskid_cli/src/commands/lock.rs',
	'crates/beskid_cli/src/commands/lsp.rs',
	'crates/beskid_cli/src/commands/migrate_bsol.rs',
	'crates/beskid_cli/src/commands/new.rs',
	'crates/beskid_cli/src/commands/package.rs',
	'crates/beskid_cli/src/commands/parse.rs',
	'crates/beskid_cli/src/commands/repl.rs',
	'crates/beskid_cli/src/commands/run.rs',
	'crates/beskid_cli/src/commands/runtime_kit.rs',
	'crates/beskid_cli/src/commands/test.rs',
	'crates/beskid_cli/src/commands/toolchain.rs',
	'crates/beskid_cli/src/commands/toolchain_owner.rs',
	'crates/beskid_cli/src/commands/tree.rs',
	'crates/beskid_cli/src/commands/validate_bsol.rs',
	'crates/beskid_pckg/src/cli/arguments.rs',
];

/** Flattens a command tree into entries that carry their full invocation path. */
function flattenCommands(commands, parents = []) {
	return commands.flatMap((command) => {
		const invocation = [...parents, command.name];
		return [{ command, invocation }, ...flattenCommands(command.subcommands ?? [], invocation)];
	});
}

const allEntries = flattenCommands(snapshot.commands);
const pageEntries = allEntries.filter(({ command }) => command.page);
const removedRoots = snapshot.removedRoots;

function pinnedGit(...args) {
	return execFileSync('git', ['-C', compilerRoot, ...args], { encoding: 'utf8' }).trim();
}

/** Git blob id of a pinned file as it exists in the checked-out compiler tree. */
function checkoutBlob(sourcePath) {
	return pinnedGit('hash-object', path.join(compilerRoot, sourcePath));
}

function checkoutSource(sourcePath) {
	return readFileSync(path.join(compilerRoot, sourcePath), 'utf8');
}

function enumVariants(source, enumName) {
	const declaration = source.indexOf(`enum ${enumName}`);
	assert.notEqual(declaration, -1, `missing enum ${enumName}`);
	const opening = source.indexOf('{', declaration);
	let depth = 0;
	let lineStart = opening + 1;
	const variants = [];
	let hidden = false;
	for (let index = opening; index < source.length; index += 1) {
		if (source[index] === '{') depth += 1;
		if (source[index] === '}') depth -= 1;
		if (source[index] === '\n') {
			if (depth === 1) {
				const line = source.slice(lineStart, index).trim();
				if (/^#\[command\([^\]]*hide\s*=\s*true/.test(line)) hidden = true;
				const variant = line.match(/^([A-Z][A-Za-z0-9]*)\s*(?:\(|\{|,)/)?.[1];
				if (variant) {
					if (!hidden) variants.push(variant.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase());
					hidden = false;
				}
			}
			lineStart = index + 1;
		}
		if (depth === 0) break;
	}
	return variants;
}

async function markdownFiles(relativeDirectory) {
	const directory = new URL(`${relativeDirectory}/`, contentRoot);
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const relativePath = path.posix.join(relativeDirectory, entry.name);
			return entry.isDirectory()
				? markdownFiles(relativePath)
				: /\.mdx?$/.test(entry.name)
					? [relativePath]
					: [];
		}),
	);
	return nested.flat();
}

function diagnostics(relativePath, source, rule, pattern, allow = () => false) {
	return source.split('\n').flatMap((line, index) =>
		pattern.test(line) && !allow(line)
			? [`${relativePath}:${index + 1}: ${rule}: ${line.trim()}`]
			: [],
	);
}

async function commandPagePaths() {
	const commandDirectory = new URL('reference/cli/commands/', contentRoot);
	return (await readdir(commandDirectory))
		.filter((name) => /\.mdx?$/.test(name))
		.map((name) => ({ name: name.replace(/\.mdx?$/, ''), relativePath: `reference/cli/commands/${name}` }));
}

test('active Book and reference guidance uses the current toolchain contracts', async () => {
	const paths = (await Promise.all(scopedDirectories.map(markdownFiles))).flat();
	const failures = [];

	for (const relativePath of paths) {
		const source = await readFile(new URL(relativePath, contentRoot), 'utf8');
		const runClaimPattern = relativePath === 'reference/cli/commands/run.md'
			? /JIT/i
			: /(?:title:\s*["']?JIT run|\/commands\/run\/[^\n]*JIT|JIT-compile[^\n]*`?beskid run)/i;
		failures.push(
			...diagnostics(relativePath, source, 'use .bproj and .bws', /(?:project|workspace)\.proj/i, (line) =>
				/legacy|rejected|former/i.test(line),
			),
			...diagnostics(relativePath, source, 'the pckg service is implemented in Rust', /ASP\.NET|dotnet/i),
			...diagnostics(relativePath, source, 'use pnpm for website commands', /\bbun(?:x)?\b/i),
			...diagnostics(relativePath, source, 'use focused test crates and repository gates', /\bbeskid_tests\b/),
			...diagnostics(relativePath, source, 'use current pckg operations', /\bbeskid(?:\s+dev\s+package\s+registry|\s+pckg)\s+(?:login|dry-run|publish)\b/i),
			...diagnostics(relativePath, source, 'use ABI-v5 runtime kits', /ABI[ -]?v4/i, (line) =>
				/Standard.*defines.*ABI v4.*conflict|conflict.*ABI v4/i.test(line),
			),
			...diagnostics(relativePath, source, 'use the TypedProgram and CodegenInput production path', /\bHIR\b|\bbeskid_runtime\b/),
			...diagnostics(
				relativePath,
				source,
				'beskid run is AOT',
				runClaimPattern,
				(line) => /does not|not the|instead of/i.test(line),
			),
			...diagnostics(relativePath, source, 'link to identity-preserving Standard routes', /\/platform-spec\//),
		);
	}

	assert.deepEqual(failures, [], failures.join('\n'));
});

test('CLI reference has one Markdown page for every pinned command that owns a page and no extra page', async () => {
	const pages = (await commandPagePaths()).map(({ name }) => name).sort();
	const expected = pageEntries.map(({ command }) => command.page);
	assert.equal(new Set(expected).size, expected.length, 'two pinned commands share one page');
	assert.deepEqual(pages, [...expected].sort());
	for (const command of snapshot.commands) {
		assert.ok(command.page, `root command ${command.name} needs its own page`);
	}
});

test('current CLI guidance has no retired full-screen commands and keeps graph TUI', async () => {
	const pages = (await commandPagePaths()).map(({ name }) => name);
	assert.equal(pages.includes('hi'), false, 'the removed hi command must not have a live reference page');
	assert.equal(rootCommands.includes('hi'), false, 'the pinned command inventory must omit hi');
	const cliIndex = await readFile(new URL('reference/cli/index.md', contentRoot), 'utf8');
	const commandIndex = await readFile(new URL('reference/cli/command-reference.md', contentRoot), 'utf8');
	const newPage = await readFile(new URL('reference/cli/commands/new.md', contentRoot), 'utf8');
	const replPage = await readFile(new URL('reference/cli/commands/repl.md', contentRoot), 'utf8');
	const graphPage = await readFile(new URL('reference/cli/commands/graph.md', contentRoot), 'utf8');
	for (const source of [cliIndex, commandIndex, newPage, replPage]) {
		assert.doesNotMatch(source, /beskid hi|commands\/hi\/|new --tui|template picker|full-screen/i);
	}
	assert.match(replPage, /line-oriented/i);
	assert.doesNotMatch(replPage, /otherwise, a terminal starts the interactive interface/i);
	assert.match(graphPage, /--tui/);
});

test('pinned CLI fixture is tied to the compiler source blobs and the Clap enums', () => {
	assert.equal(pinnedGit('rev-parse', 'HEAD'), snapshot.sourceRevision, 'source checkout must match the release pin');
	assert.deepEqual(Object.keys(snapshot.sourceBlobs ?? {}).sort(), [...pinnedSourceFiles].sort());
	for (const sourcePath of pinnedSourceFiles) {
		assert.equal(snapshot.sourceBlobs[sourcePath], checkoutBlob(sourcePath), `${sourcePath}: pinned blob changed`);
	}
	// Once these files are committed, the same blobs must also be reachable from the pinned revision.
	const committed = pinnedSourceFiles.filter((sourcePath) =>
		pinnedGit('status', '--porcelain', '--', sourcePath) === '');
	for (const sourcePath of committed) {
		assert.equal(pinnedGit('rev-parse', `${snapshot.sourceRevision}:${sourcePath}`), snapshot.sourceBlobs[sourcePath],
			`${sourcePath}: pinned blob is not the blob at the pinned revision`);
	}
	assert.deepEqual(enumVariants(checkoutSource('crates/beskid_cli/src/cli/app.rs'), 'Commands'), rootCommands);
});

test('pinned command tree follows every Clap subcommand enum', () => {
	const sources = {
		dev: ['crates/beskid_cli/src/cli/dev.rs', 'DevCommand', ['dev']],
		syntax: ['crates/beskid_cli/src/cli/dev.rs', 'DevSyntaxCommand', ['dev', 'syntax']],
		project: ['crates/beskid_cli/src/cli/dev.rs', 'DevProjectCommand', ['dev', 'project']],
		bsol: ['crates/beskid_cli/src/cli/dev.rs', 'DevBsolCommand', ['dev', 'bsol']],
		package: ['crates/beskid_cli/src/commands/package.rs', 'PackageCommand', ['package']],
		template: ['crates/beskid_cli/src/commands/package.rs', 'TemplateCommand', ['package', 'template']],
		toolchain: ['crates/beskid_cli/src/commands/toolchain.rs', 'ToolchainCommand', ['toolchain']],
		runtimeKit: ['crates/beskid_cli/src/commands/runtime_kit.rs', 'RuntimeKitCommand', ['dev', 'runtime-kit']],
		mod: ['crates/beskid_cli/src/commands/compiler_mod.rs', 'ModCommand', ['dev', 'mod']],
		import: ['crates/beskid_cli/src/commands/import.rs', 'ImportCommand', ['dev', 'import']],
		lsp: ['crates/beskid_cli/src/commands/lsp.rs', 'LspCommand', ['dev', 'lsp']],
	};
	for (const [label, [file, enumName, invocation]] of Object.entries(sources)) {
		const entry = allEntries.find((candidate) => candidate.invocation.join(' ') === invocation.join(' '));
		assert.ok(entry, `${label}: missing pinned command ${invocation.join(' ')}`);
		assert.deepEqual(
			(entry.command.subcommands ?? []).map(({ name }) => name),
			enumVariants(checkoutSource(file), enumName),
			`${label}: pinned subcommands differ from ${enumName}`,
		);
	}
});

test('new command defaults its output to the project name and pins its registry default', () => {
	const command = snapshot.commands.find(({ name }) => name === 'new');
	assert.equal(command.flags.includes('--tui'), false, 'the template picker is removed');
	assert.equal((command.requiredFlags ?? []).includes('--output'), false, '--output is optional because it defaults to NAME');
	assert.equal(command.conditionalRequirements, undefined);
	assert.equal(command.defaults['--output'], '<NAME>');
	assert.equal(command.defaults['--registry-url'], 'https://pckg.beskid-lang.org');
	assert.deepEqual(command.positionals, [{ name: 'NAME', required: false }]);
	const source = checkoutSource('crates/beskid_cli/src/commands/new.rs');
	assert.doesNotMatch(source, /\bpub tui\b|--tui|tui-picker/i);
	assert.match(source, /flags\.output = Some\(PathBuf::from\(&name\)\)/);
	assert.match(source, /required_unless_present = "list"/);
});

/** Tokens a command page must show; subcommands that own a page are checked on their own page. */
function collectContractTokens(command) {
	const tokens = [...(command.flags ?? []), ...(command.requiredFlags ?? [])];
	for (const positional of command.positionals ?? []) tokens.push(positional.name);
	for (const [flag, value] of Object.entries(command.defaults ?? {})) tokens.push(flag, value);
	for (const subcommand of command.subcommands ?? []) {
		tokens.push(subcommand.name);
		if (!subcommand.page) tokens.push(...collectContractTokens(subcommand));
	}
	return [...new Set(tokens)];
}

test('every CLI page documents its pinned flags, arguments, subcommands, defaults, and an example', async () => {
	const root = fileURLToPath(new URL('../../../../', import.meta.url));
	const gitlink = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD:compiler'], { encoding: 'utf8' }).trim();
	assert.equal(snapshot.sourceRevision, gitlink, 'CLI docs must match the root compiler pin');
	assert.equal(snapshot.commands.length, 14);
	assert.equal(pageEntries.length, 28);
	const pagePaths = new Map((await commandPagePaths()).map(({ name, relativePath }) => [name, relativePath]));
	const failures = [];
	for (const { command, invocation } of pageEntries) {
		const relativePath = pagePaths.get(command.page);
		const source = await readFile(new URL(relativePath, contentRoot), 'utf8');
		for (const token of collectContractTokens(command)) {
			if (!source.includes(token)) failures.push(`${relativePath}: missing pinned CLI token ${token}`);
		}
		if (!source.includes(`beskid ${invocation.join(' ')}`)) failures.push(`${relativePath}: missing command example`);
	}
	assert.deepEqual(failures, [], failures.join('\n'));
});

test('the pinned removed-root map matches the CLI migration errors', () => {
	const source = checkoutSource('crates/beskid_cli/src/cli/app.rs');
	for (const [removed, replacement] of Object.entries(removedRoots)) {
		assert.equal(rootCommands.includes(removed), false, `${removed} must not be a root command`);
		assert.ok(
			source.includes(`Some("${removed}") => Some("${replacement}")`),
			`${removed} must map to ${replacement} in the CLI migration errors`,
		);
		assert.ok(
			allEntries.some(({ invocation }) => invocation.join(' ') === replacement),
			`${replacement} must be a pinned command`,
		);
	}
});

test('the canonical dev page contains every pinned removed-root mapping', async () => {
	const source = await readFile(new URL('reference/cli/commands/dev.md', contentRoot), 'utf8');
	for (const [removed, replacement] of Object.entries(removedRoots)) {
		if (replacement.startsWith('dev ')) {
			assert.match(source, new RegExp(`beskid ${replacement}\\b[^\\n]*beskid ${removed}\\b`), `${removed} must map to ${replacement}`);
		} else {
			assert.ok(source.includes(`\`${removed}\` is now \`${replacement}\``), `${removed} must be listed as renamed to ${replacement}`);
		}
	}
});

test('removed-root mappings are defined only on the canonical dev page and the removed command own page', async () => {
	const paths = (await Promise.all(scopedDirectories.map(markdownFiles))).flat();
	const failures = [];
	for (const relativePath of paths) {
		if (relativePath === 'reference/cli/commands/dev.md') continue;
		const source = await readFile(new URL(relativePath, contentRoot), 'utf8');
		const ownPage = path.posix.basename(relativePath).replace(/\.mdx?$/, '');
		for (const [removed, replacement] of Object.entries(removedRoots)) {
			if (relativePath.startsWith('reference/cli/commands/') && ownPage === removed) continue;
			failures.push(...diagnostics(
				relativePath,
				source,
				'link to the canonical dev page for the removed-root map',
				new RegExp(`\\bbeskid ${removed}\\b[^\\n]*\\bbeskid ${replacement}\\b|\\bbeskid ${replacement}\\b[^\\n]*\\bbeskid ${removed}\\b`),
			));
		}
	}
	assert.deepEqual(failures, [], failures.join('\n'));
});

test('project examples use named BSOL roots and filenames that match project names', async () => {
	const relativePath = 'reference/projects/examples.md';
	const source = await readFile(new URL(relativePath, contentRoot), 'utf8');
	assert.doesNotMatch(source, /^project\s*\{/m, `${relativePath}: legacy anonymous project root`);
	for (const name of ['MyApp', 'App', 'Std', 'NetLib', 'Project']) {
		assert.match(source, new RegExp(`\\*\\*${name}\\.bproj\\*\\*[\\s\\S]*?\\n${name} \\{[\\s\\S]*?name\\s*=\\s*"${name}"`), `${relativePath}: ${name}.bproj must use matching named root and name`);
	}
});

test('reviewed command contracts and terminology do not regress', async () => {
	const files = {
		cliTour: await readFile(new URL('02-path-not-found-tooling-anyway/cli-tour.md', contentRoot), 'utf8'),
		newPage: await readFile(new URL('reference/cli/commands/new.md', contentRoot), 'utf8'),
		newChapter: await readFile(new URL('03-project-proj-or-it-didnt-happen/beskid-new.md', contentRoot), 'utf8'),
		mods: await readFile(new URL('15-mods-plugins-with-consequences/beskid-mod-cli.md', contentRoot), 'utf8'),
		rustAbi: await readFile(new URL('21-ffi-and-forbidden-friendships/rust-abi-profile.md', contentRoot), 'utf8'),
		bsol: await readFile(new URL('03-project-proj-or-it-didnt-happen/bsol-and-the-config-stack.md', contentRoot), 'utf8'),
		format: await readFile(new URL('reference/cli/commands/format.md', contentRoot), 'utf8'),
		cliIndex: await readFile(new URL('reference/cli/index.md', contentRoot), 'utf8'),
	};
	assert.match(files.cliTour, /commands\/dev\//, 'CLI tour must link the canonical alias map');
	assert.doesNotMatch(files.cliTour, /dev build (?:run|compile\/run|compile\/run\/test)/, 'dev build has no run subcommand');
	assert.doesNotMatch(files.newPage, /--tui/);
	assert.match(files.newPage, /`beskid new <NAME>`/);
	assert.match(files.newPage, /Required unless you pass `--list`/i);
	assert.doesNotMatch(files.newPage, /^\| [23] \|/m, 'new uses the standard non-zero error status, not invented categories');
	assert.match(files.newChapter, /beskid new \S+/);
	assert.match(files.mods, /beskid dev mod rebuild/);
	assert.match(files.mods, /commands\/mod\//);
	assert.match(files.rustAbi, /Standard[^\n]*ABI v4/i);
	assert.match(files.rustAbi, /implementation[^\n]*ABI-v5/i);
	assert.match(files.rustAbi, /under reconciliation/i);
	assert.match(files.bsol, /BSOL[^\n]*parser[^\n]*\.bproj/i);
	assert.match(files.bsol, /\.bd[^\n]*Beskid source parser/i);
	assert.doesNotMatch(files.bsol, /Both paths use one parser/i);
	assert.match(files.format, /compiler\/crates\/beskid_tests_surface\/fixtures\/format/);
	assert.match(files.cliIndex, /--log-cranelift/);
	for (const source of Object.values(files)) assert.doesNotMatch(source, /\ba\s+`?App\.bproj\b/i);
});

test('removed publish command route redirects without replacing earlier reference redirects', async () => {
	const config = await readFile(new URL('astro.config.mjs', siteRoot), 'utf8');
	assert.match(config, /book\/reference\/cli\/commands\/publish[\s\S]*docs\/packages\/publish/);
	assert.match(config, /book\/reference\/lsp\/readme/);
	assert.match(config, /book\/reference\/projects\/readme/);
});

test('retained Book diagrams have accessible metadata and adjacent text equivalents', async () => {
	const paths = (await Promise.all(scopedDirectories.map(markdownFiles))).flat();
	const failures = [];
	for (const relativePath of paths) {
		const source = await readFile(new URL(relativePath, contentRoot), 'utf8');
		for (const match of source.matchAll(/```mermaid\n([\s\S]*?)```/g)) {
			const line = source.slice(0, match.index).split('\n').length;
			if (!/^\s*accTitle:\s*\S/m.test(match[1])) failures.push(`${relativePath}:${line}: diagram needs accTitle`);
			if (!/^\s*accDescr:\s*\S/m.test(match[1])) failures.push(`${relativePath}:${line}: diagram needs accDescr`);
			const following = source.slice(match.index + match[0].length, match.index + match[0].length + 500);
			if (!/^\s*\*\*Text equivalent:\*\*/.test(following)) {
				failures.push(`${relativePath}:${line}: diagram needs an adjacent text equivalent`);
			}
		}
	}
	assert.deepEqual(failures, [], failures.join('\n'));
});

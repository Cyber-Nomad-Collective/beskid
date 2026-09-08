import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const contentRoot = new URL('../content/docs/book/', import.meta.url);
const siteRoot = new URL('../../', import.meta.url);
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

test('CLI reference has one Markdown page for every pinned root command and no extra page', async () => {
	const pages = (await commandPagePaths()).map(({ name }) => name).sort();
	assert.deepEqual(pages, [...rootCommands].sort());
});

function collectContractTokens(command) {
	const tokens = [...(command.flags ?? []), ...(command.requiredFlags ?? [])];
	for (const positional of command.positionals ?? []) tokens.push(positional.name);
	for (const [flag, value] of Object.entries(command.defaults ?? {})) tokens.push(flag, value);
	for (const subcommand of command.subcommands ?? []) {
		tokens.push(subcommand.name, ...collectContractTokens(subcommand));
	}
	return [...new Set(tokens)];
}

test('every CLI page documents its pinned flags, arguments, subcommands, defaults, and an example', async () => {
	assert.equal(snapshot.sourceRevision, '252aa528ac7ee01a64e49e9b88b32393206fbd71');
	assert.equal(snapshot.commands.length, 26);
	const pagePaths = new Map((await commandPagePaths()).map(({ name, relativePath }) => [name, relativePath]));
	const failures = [];
	for (const command of snapshot.commands) {
		const relativePath = pagePaths.get(command.name);
		const source = await readFile(new URL(relativePath, contentRoot), 'utf8');
		for (const token of collectContractTokens(command)) {
			if (!source.includes(token)) failures.push(`${relativePath}: missing pinned CLI token ${token}`);
		}
		if (!source.includes(`beskid ${command.name}`)) failures.push(`${relativePath}: missing command example`);
	}
	assert.deepEqual(failures, [], failures.join('\n'));
});

test('the canonical dev page contains every pinned grouped alias mapping', async () => {
	const dev = snapshot.commands.find(({ name }) => name === 'dev');
	const source = await readFile(new URL('reference/cli/commands/dev.md', contentRoot), 'utf8');
	for (const [grouped, root] of Object.entries(dev.groupedAliases)) {
		assert.match(source, new RegExp(`beskid ${grouped}[\\s\\S]*?beskid ${root}`), `${grouped} must map to ${root}`);
	}
});

test('grouped aliases are defined only on the canonical dev page', async () => {
	const paths = (await Promise.all(scopedDirectories.map(markdownFiles))).flat();
	const failures = [];
	for (const relativePath of paths) {
		if (relativePath === 'reference/cli/commands/dev.md') continue;
		const source = await readFile(new URL(relativePath, contentRoot), 'utf8');
		failures.push(...diagnostics(relativePath, source, 'link to the canonical dev alias map', /beskid dev (?:syntax|build|project|package)/i));
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
	assert.match(files.newPage, /--tui/);
	assert.match(files.newPage, /exactly one template selector is required/i);
	assert.match(files.newPage, /(?:required[^\n]*--output|--output[^\n]*required)/i);
	assert.doesNotMatch(files.newPage, /^\| [23] \|/m, 'new uses the standard non-zero error status, not invented categories');
	assert.match(files.newChapter, /beskid new console .*--output/);
	assert.match(files.mods, /beskid mod rebuild/);
	assert.match(files.mods, /commands\/mod\//);
	assert.match(files.rustAbi, /Standard[^\n]*ABI v4/i);
	assert.match(files.rustAbi, /implementation[^\n]*ABI-v5/i);
	assert.match(files.rustAbi, /under reconciliation/i);
	assert.match(files.bsol, /BSOL[^\n]*parser[^\n]*\.bproj/i);
	assert.match(files.bsol, /\.bd[^\n]*Beskid source parser/i);
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

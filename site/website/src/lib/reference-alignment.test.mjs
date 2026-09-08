import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const contentRoot = new URL('../content/docs/book/', import.meta.url);
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

// Pinned from compiler object 252aa528ac7ee01a64e49e9b88b32393206fbd71,
// crates/beskid_cli/src/cli.rs. Keep this test independent of the conflicted checkout.
const rootCommands = [
	'dev',
	'parse',
	'tree',
	'analyze',
	'doc',
	'format',
	'clif',
	'run',
	'test',
	'repl',
	'build',
	'mod',
	'import',
	'fetch',
	'lock',
	'update',
	'corelib',
	'runtime-kit',
	'new',
	'pckg',
	'graph',
	'hi',
	'lsp',
	'up',
	'validate-bsol',
	'migrate-bsol',
];

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
			...diagnostics(relativePath, source, 'use ABI-v5 runtime kits', /ABI[ -]?v4/i),
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

test('CLI reference has one page for every pinned root command and no publish page', async () => {
	const commandDirectory = new URL('reference/cli/commands/', contentRoot);
	const pages = (await readdir(commandDirectory))
		.filter((name) => name.endsWith('.md'))
		.map((name) => name.slice(0, -3))
		.sort();
	assert.deepEqual(pages, [...rootCommands].sort());
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

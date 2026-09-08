import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
	APPROVED_TERMS,
	reviewDocument,
	reviewPaths,
} from '../../scripts/review-ste-docs.mjs';

const longSentence = 'This sentence contains many ordinary words because it deliberately continues beyond the review limit and gives the checker enough separate tokens to report a useful sentence length candidate today.';

function rules(candidates) {
	return candidates.map((candidate) => candidate.rule);
}

test('reports sentence-length and passive-voice candidates with source lines', () => {
	const candidates = reviewDocument(`---\ntitle: Example\ndescription: This frontmatter sentence was deliberately written with enough words to exceed every configured review limit without becoming a candidate.\n---\n\n${longSentence}\nThe package was created by the maintainer.\n`, 'guide.md');

	assert.deepEqual(candidates.map(({ file, line, rule }) => ({ file, line, rule })), [
		{ file: 'guide.md', line: 6, rule: 'sentence-length' },
		{ file: 'guide.md', line: 7, rule: 'passive-voice' },
	]);
});

test('reviews a rendered sentence across Markdown line wraps and keeps its first source line', () => {
	const candidates = reviewDocument(`This rendered sentence starts on the first source line with several ordinary words\nand continues on the second source line with several more ordinary words\nbefore it ends on the third source line beyond the review limit.\n`, 'wrapped.md');

	assert.deepEqual(candidates.map(({ line, rule }) => ({ line, rule })), [
		{ line: 1, rule: 'sentence-length' },
	]);
});

test('does not join sentences across Markdown block boundaries or inspect MDX markup', () => {
	const candidates = reviewDocument(`## A short heading stays in its own block\n\nThis short paragraph has fewer than twenty-six words.\n\n- This short list item stays separate from the next item.\n- This second short list item also stays separate.\n\n| Column | Meaning |\n| --- | --- |\n| Alpha | This short table cell stays in its row. |\n| Beta | This other short table cell stays in its row. |\n\n<Aside\n  title="The XYZ result was built and set by a hidden prop"\n>\nUse the tool.\n</Aside>\n\n{\n  hidden: "The QBI result was built and set inside an expression"\n}\n`, 'blocks.mdx');

	assert.deepEqual(candidates, []);
});

test('reviews prose inside inline MDX containers but excludes multiline expressions', () => {
	const candidates = reviewDocument(`<Aside>The XYZ result was built by the tool.</Aside>\n{condition ?\n  <Aside title={"The QBI result was built by hidden code"}>\n    {"A hidden QBI sentence was deliberately written with enough extra ordinary words to exceed the configured sentence limit without becoming reviewable prose."}\n  </Aside>\n  : null}\nUse the tool.\n`, 'inline-container.mdx');

	assert.deepEqual(candidates.map(({ line, rule, token }) => ({ line, rule, ...(token ? { token } : {}) })), [
		{ line: 1, rule: 'passive-voice' },
		{ line: 1, rule: 'unexplained-abbreviation', token: 'XYZ' },
	]);
});

test('keeps braces inside MDX regular-expression literals out of brace depth', async (t) => {
	const expressions = [
		['escaped opening brace', String.raw`{/\{/.test("QBI was built")}`],
		['closing brace', String.raw`{/}/.test("QBI was built")}`],
		['closing brace in a character class', String.raw`{/[}]/.test("QBI was built")}`],
		['opening brace in a character class', String.raw`{/[{]/.test("QBI was built")}`],
		['brace after an escaped slash', String.raw`{/a\/}/.test("QBI was built")}`],
		['division operator', String.raw`{total / count > 0 ? "QBI was built" : null}`],
	];

	for (const [name, expression] of expressions) {
		await t.test(name, () => {
			const candidates = reviewDocument(`${expression}\nThe XYZ result was built by the tool.\n`, 'regex-expression.mdx');

			assert.deepEqual(candidates.map(({ line, rule, token }) => ({ line, rule, ...(token ? { token } : {}) })), [
				{ line: 2, rule: 'passive-voice' },
				{ line: 2, rule: 'unexplained-abbreviation', token: 'XYZ' },
			]);
		});
	}
});

test('uses regular-expression lexical state inside JSX attribute expressions', () => {
	const candidates = reviewDocument(`<Aside pattern={/\{/}>\nThe XYZ result was built by the tool.\n</Aside>\n`, 'regex-attribute.mdx');

	assert.deepEqual(candidates.map(({ line, rule, token }) => ({ line, rule, ...(token ? { token } : {}) })), [
		{ line: 2, rule: 'passive-voice' },
		{ line: 2, rule: 'unexplained-abbreviation', token: 'XYZ' },
	]);
});

test('recognizes operand positions after parentheses and brackets without breaking division', async (t) => {
	const expressions = [
		['function argument', String.raw`{matches(/\{/, "QBI was built")}`],
		['JSX attribute function argument', String.raw`<Aside matcher={matches(/\{/, "QBI was built")}>\nThe XYZ result was built by the tool.\n</Aside>`],
		['if condition', String.raw`{(() => { if (/\{/.test(value)) return "QBI was built"; })()}`],
		['computed index expression', String.raw`{patterns[/\{/].test("QBI was built")}`],
		['array literal', String.raw`{[/\{/].some((pattern) => pattern.test(value))}`],
		['division', String.raw`{total / count}`],
		['index followed by division', String.raw`{items[index] / count}`],
	];

	for (const [name, expression] of expressions) {
		await t.test(name, () => {
			const source = expression.includes('\n') ? expression : `${expression}\nThe XYZ result was built by the tool.`;
			const candidates = reviewDocument(`${source}\n`, 'operand-position.mdx');

			assert.deepEqual(candidates.map(({ line, rule, token }) => ({ line, rule, ...(token ? { token } : {}) })), [
				{ line: 2, rule: 'passive-voice' },
				{ line: 2, rule: 'unexplained-abbreviation', token: 'XYZ' },
			]);
		});
	}
});

test('applies abbreviation explanations in source order inside a joined paragraph', () => {
	const candidates = reviewDocument(`This sentence starts here\nand uses QBI before the quality boundary interface\n(QBI) explanation appears. Use QBI after the explanation.\n`, 'ordered-terms.md');

	assert.deepEqual(candidates.map(({ line, rule, token }) => ({ line, rule, token })), [
		{ line: 2, rule: 'unexplained-abbreviation', token: 'QBI' },
	]);
});

test('joins a CommonMark lazy list continuation into the rendered sentence', () => {
	const candidates = reviewDocument(`- This list item begins a rendered sentence with enough ordinary words to approach the configured candidate threshold\nand this lazy continuation adds enough more ordinary words to cross the limit safely.\n`, 'lazy-list.md');

	assert.deepEqual(candidates.map(({ line, rule }) => ({ line, rule })), [
		{ line: 1, rule: 'sentence-length' },
	]);
});

test('reports controlled irregular passive participles', () => {
	const candidates = reviewDocument('The package was built by CI.\nThe default is set by the project.\nThe builder built the package and set the default.\n', 'irregular.md');

	assert.deepEqual(candidates.map(({ line, rule }) => ({ line, rule })), [
		{ line: 1, rule: 'passive-voice' },
		{ line: 2, rule: 'passive-voice' },
	]);
});

test('does not treat set or built noun phrases as passive voice', () => {
	const candidates = reviewDocument(`The result is a set of values.\nThis is the set that applies.\nThe object is a built structure.\nThe default is set by the project.\nThe artifact was deliberately built by CI.\nThe value is not yet set by default.\n`, 'passive-boundaries.md');

	assert.deepEqual(candidates.map(({ line, rule }) => ({ line, rule })), [
		{ line: 4, rule: 'passive-voice' },
		{ line: 5, rule: 'passive-voice' },
		{ line: 6, rule: 'passive-voice' },
	]);
});

test('reports unexplained abbreviations but accepts explanations and approved Beskid terms', () => {
	const candidates = reviewDocument(`Use XYZ for this step.\nApplication binary interface (QBI) identifies the boundary. The explanation now covers QBI.\nUse AOT, ABI, API, ARM64, BSOL, CI, CLI, JSON, LSP, MCP, and MDX.\nUse OpenBao, OpenSpec, PATH, POSIX, README, SDK, SQLite, STE, TOML, UI, URL, VS Code, VSX, and YAML.\nUse an AOT-only build and a CLI-backed server under AGPL-3.0 or CC-BY-4.0 terms.\n`, 'terms.md');

	assert.deepEqual(candidates.map(({ line, rule, token }) => ({ line, rule, token })), [
		{ line: 1, rule: 'unexplained-abbreviation', token: 'XYZ' },
	]);
	for (const term of ['AGPL-3.0', 'AOT', 'ABI', 'API', 'ARM64', 'BSOL', 'CC-BY-4.0', 'CI', 'CLI', 'LSP', 'MCP', 'POSIX', 'README', 'STE', 'VSX']) {
		assert.ok(APPROVED_TERMS.has(term), `${term} must be an approved Beskid term`);
	}
});

test('excludes frontmatter, fenced code, and requirement or scenario sections', () => {
	const candidates = reviewDocument(`---\ndescription: The ABC package was generated by a process whose long descriptive frontmatter sentence contains enough additional words to exceed the configured review limit safely.\n---\n\n\`\`\`text\nThe XYZ package was created by a generated process and this line contains enough words to trigger all candidate rules if fenced code is not excluded.\n\`\`\`\n\n#### Requirement: XYZ output is generated\n<!-- ste-review: ignore-next-line passive-voice -- Preserve the exact normative requirement wording. -->\nThe XYZ output was generated by the service and this sentence contains enough words to trigger all candidate rules if requirement prose is not excluded.\n\n##### Scenario: XYZ output exists\n- **GIVEN** the XYZ input was created\n- **WHEN** the XYZ process is started\n- **THEN** the XYZ output is returned\n\n## Guidance\nUse the tool.\n`, 'excluded.md');

	assert.deepEqual(candidates, []);
});

test('applies an explicit, reasoned exception only to the next reviewable line and named rules', () => {
	const candidates = reviewDocument(`<!-- ste-review: ignore-next-line passive-voice,sentence-length -- Exact upstream quotation. -->\n${longSentence} The result was created by the tool.\nThe next result was created by the tool.\n`, 'exceptions.md');

	assert.deepEqual(rules(candidates), ['passive-voice']);
	assert.equal(candidates[0].line, 3);
	assert.throws(
		() => reviewDocument('<!-- ste-review: ignore-next-line passive-voice -->\nThe result was created.\n', 'bad.md'),
		/reason/i,
	);
	assert.throws(
		() => reviewDocument('<!-- ste-review: ignore-next-line passive-voice -- Needed. -->\nThe result was created.\n', 'vague.md'),
		/specific reason/i,
	);
	assert.throws(
		() => reviewDocument('<!-- ste-review: ignore-next-line passive-voice -- Preserve the exact upstream wording. -->\nUse the result.\n', 'unused.md'),
		/unused suppression.*passive-voice/i,
	);
	assert.throws(
		() => reviewDocument('Use the result.\n<!-- ste-review: ignore-next-line passive-voice -- Preserve the exact upstream wording. -->\n', 'stale.md'),
		/no following reviewable prose/i,
	);
});

test('reports incorrect indefinite articles before initialisms', () => {
	const candidates = reviewDocument('Use a API response. Use an CLI command.\n', 'articles.md');

	assert.deepEqual(candidates.map(({ rule, token }) => ({ rule, token })), [
		{ rule: 'article', token: 'a API' },
		{ rule: 'article', token: 'an CLI' },
	]);
});

test('reviews Markdown and MDX paths in deterministic file and line order', async (t) => {
	const root = await mkdtemp(path.join(tmpdir(), 'beskid-ste-review-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'nested'));
	await writeFile(path.join(root, 'z.mdx'), 'The result was created by the tool.\n');
	await writeFile(path.join(root, 'nested', 'a.md'), 'Use XYZ now.\n');
	await writeFile(path.join(root, 'ignored.txt'), 'The result was created by XYZ.\n');

	const candidates = await reviewPaths([root]);
	assert.deepEqual(candidates.map(({ file, line, rule }) => ({ file: path.relative(root, file), line, rule })), [
		{ file: 'nested/a.md', line: 1, rule: 'unexplained-abbreviation' },
		{ file: 'z.mdx', line: 1, rule: 'passive-voice' },
	]);
});

test('does not follow file, directory, or loop symlinks during recursive review', async (t) => {
	const parent = await mkdtemp(path.join(tmpdir(), 'beskid-ste-symlink-'));
	t.after(() => rm(parent, { recursive: true, force: true }));
	const root = path.join(parent, 'docs');
	const outside = path.join(parent, 'outside');
	await mkdir(path.join(root, 'nested'), { recursive: true });
	await mkdir(outside);
	await writeFile(path.join(root, 'inside.md'), 'Use the tool.\n');
	await writeFile(path.join(outside, 'outside.md'), 'Use XYZ now.\n');
	await symlink(path.join(outside, 'outside.md'), path.join(root, 'outside-file.md'));
	await symlink(outside, path.join(root, 'outside-directory'));
	await symlink(root, path.join(root, 'nested', 'loop'));

	assert.deepEqual(await reviewPaths([root]), []);
});

test('CLI output is advisory and does not claim certification', () => {
	const script = new URL('../../scripts/review-ste-docs.mjs', import.meta.url);
	const fixture = new URL('../../src/content/docs/docs/contributing/ste-100.md', import.meta.url);
	const result = spawnSync(process.execPath, [script.pathname, fixture.pathname], { encoding: 'utf8' });

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /candidate(?:s)? for manual review/i);
	assert.match(result.stdout, /does not certify ASD-STE100 compliance/i);
	assert.doesNotMatch(result.stdout, /certified|compliant documentation/i);
});

test('contributor guidance documents manual review and narrow exception syntax', async () => {
	const [stePage, documentationPage, packageFile] = await Promise.all([
		readFile(new URL('../content/docs/docs/contributing/ste-100.md', import.meta.url), 'utf8'),
		readFile(new URL('../content/docs/docs/contributing/documentation.md', import.meta.url), 'utf8'),
		readFile(new URL('../../package.json', import.meta.url), 'utf8'),
	]);

	assert.match(packageFile, /"review:ste":\s*"node scripts\/review-ste-docs\.mjs"/);
	for (const phrase of ['pnpm review:ste', 'candidate', 'manual review', 'does not certify', 'ignore-next-line', 'reason']) {
		assert.ok(stePage.includes(phrase), `STE guidance must explain ${phrase}`);
	}
	assert.match(stePage, /unused suppression/i);
	assert.match(stePage, /no following reviewable prose/i);
	for (const rule of ['sentence-length', 'passive-voice', 'unexplained-abbreviation', 'article']) {
		assert.ok(stePage.includes(rule), `STE guidance must name the ${rule} rule`);
	}
	assert.match(documentationPage, /run `pnpm review:ste`/i);
	assert.match(documentationPage, /review each candidate/i);
});

test('project records define the Docs contract and advisory review gate', async () => {
	const [glossary, changelog] = await Promise.all([
		readFile(new URL('../../../../GLOSSARY.md', import.meta.url), 'utf8'),
		readFile(new URL('../../../../CHANGELOG.md', import.meta.url), 'utf8'),
	]);

	assert.match(glossary, /^## Typed Docs annotation$/m);
	assert.match(glossary, /^## Verified procedure$/m);
	assert.match(changelog, /deterministic[^\n]*STE review/i);
	assert.match(changelog, /does not certify\s+ASD-STE100 compliance/i);
});

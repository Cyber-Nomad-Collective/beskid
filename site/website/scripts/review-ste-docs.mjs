#!/usr/bin/env node

import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_DOCS_ROOT = new URL('../src/content/docs/docs/', import.meta.url);
const SENTENCE_WORD_LIMIT = 25;
const RULE_ORDER = new Map([
	['sentence-length', 0],
	['passive-voice', 1],
	['unexplained-abbreviation', 2],
	['article', 3],
]);

export const APPROVED_TERMS = new Set([
	'ABI',
	'AGPL',
	'AGPL-3.0',
	'AMD64',
	'AOT',
	'API',
	'ARM64',
	'ASD-STE100',
	'BSOL',
	'CI',
	'CC-BY-4.0',
	'CLI',
	'CPU',
	'CSS',
	'DNS',
	'GHCR',
	'HTML',
	'HTTP',
	'HTTPS',
	'ID',
	'JSON',
	'JWT',
	'LSP',
	'MCP',
	'MDX',
	'OpenAPI',
	'PATH',
	'POSIX',
	'README',
	'REPL',
	'REST',
	'SDK',
	'SQL',
	'STE',
	'TLS',
	'TOML',
	'UI',
	'URL',
	'UUID',
	'VS',
	'VSX',
	'YAML',
]);

function candidate(file, line, rule, message, token) {
	return { file, line, rule, message, ...(token ? { token } : {}) };
}

function proseOnly(line) {
	return line
		.replace(/`[^`]*`/g, '')
		.replace(/!?(\[[^\]]*\])\([^)]*\)/g, '$1')
		.replace(/<https?:\/\/[^>]+>/g, '')
		.replace(/https?:\/\/\S+/g, '')
		.replace(/<[^>]+>/g, '')
		.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*)/, '')
		.replace(/^\s*\|?|\|?\s*$/g, '')
		.trim();
}

function wordCount(sentence) {
	return sentence.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function explanationTerms(line) {
	const terms = [];
	for (const match of line.matchAll(/\b[\p{L}][\p{L} -]{2,}\s+\(([A-Z][A-Z0-9-]{1,})\)/gu)) {
		terms.push(match[1]);
	}
	return terms;
}

function articleCandidates(line) {
	const found = [];
	const takesAn = new Set(['A', 'E', 'F', 'H', 'I', 'L', 'M', 'N', 'O', 'R', 'S', 'X']);
	for (const match of line.matchAll(/\b(a|an)\s+([A-Z][A-Z0-9-]{1,})\b/g)) {
		const expected = takesAn.has(match[2][0]) ? 'an' : 'a';
		if (match[1].toLowerCase() !== expected) found.push(match[0]);
	}
	return found;
}

function parseException(line, file, lineNumber) {
	if (!line.includes('ste-review:')) return null;
	const match = line.match(/^\s*<!--\s*ste-review:\s*ignore-next-line\s+([a-z-]+(?:\s*,\s*[a-z-]+)*)\s+--\s+(.+?)\s*-->\s*$/);
	if (!match) {
		throw new Error(`${file}:${lineNumber}: STE review exception must name rules and include a reason`);
	}
	const rules = new Set(match[1].split(',').map((rule) => rule.trim()));
	for (const rule of rules) {
		if (!RULE_ORDER.has(rule)) throw new Error(`${file}:${lineNumber}: unknown STE review rule: ${rule}`);
	}
	const reason = match[2].trim();
	if (reason.length < 20 || wordCount(reason) < 3) {
		throw new Error(`${file}:${lineNumber}: STE review exception must include a specific reason`);
	}
	return { rules, reason, sourceLine: lineNumber, targetLine: null };
}

function sourceLineForOffset(parts, offset) {
	return parts.find((part) => offset >= part.start && offset < part.end)?.line ?? parts.at(-1)?.line;
}

function sentenceSpans(block) {
	const spans = [];
	for (const match of block.text.matchAll(/[^.!?]+(?:[.!?]+(?=\s+|$)|$)/g)) {
		const leading = match[0].search(/\S/);
		if (leading < 0) continue;
		const text = match[0].trim();
		spans.push({ text, line: sourceLineForOffset(block.parts, match.index + leading) });
	}
	return spans;
}

function collectProse(source, file) {
	const lines = source.replaceAll('\r\n', '\n').split('\n');
	const blocks = [];
	const exceptions = [];
	let inFrontmatter = lines[0] === '---';
	let inFence = false;
	let inMdxTag = false;
	let inMdxExpression = false;
	let excludedHeadingLevel = null;
	let pendingException = null;
	let activeBlock = null;
	let activeKind = null;

	const flush = () => {
		if (activeBlock?.text) blocks.push(activeBlock);
		activeBlock = null;
		activeKind = null;
	};
	const add = (prose, line, kind, continueBlock) => {
		if (!continueBlock || !activeBlock || activeKind !== kind) flush();
		if (!activeBlock) activeBlock = { text: '', parts: [] };
		if (pendingException) {
			pendingException.targetLine = line;
			exceptions.push(pendingException);
			pendingException = null;
		}
		const separator = activeBlock.text ? ' ' : '';
		activeBlock.text += separator;
		const start = activeBlock.text.length;
		activeBlock.text += prose;
		activeBlock.parts.push({ start, end: activeBlock.text.length, line });
		activeKind = kind;
	};

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const lineNumber = index + 1;

		if (inFrontmatter) {
			if (index > 0 && line === '---') inFrontmatter = false;
			flush();
			continue;
		}

		if (/^\s*(```|~~~)/.test(line)) {
			inFence = !inFence;
			flush();
			continue;
		}
		if (inFence) {
			flush();
			continue;
		}
		if (inMdxTag) {
			if (/>\s*$/.test(line)) inMdxTag = false;
			flush();
			continue;
		}
		if (inMdxExpression) {
			if (/^\s*\}\s*$/.test(line)) inMdxExpression = false;
			flush();
			continue;
		}
		if (/^\s*\{\s*$/.test(line)) {
			inMdxExpression = true;
			flush();
			continue;
		}
		if (/^\s*<\/?[A-Za-z][\w.:-]*(?:\s|>|$)/.test(line)) {
			if (!/>\s*$/.test(line)) inMdxTag = true;
			flush();
			continue;
		}

		const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
		if (heading) {
			const level = heading[1].length;
			const isNormativeHeading = /^(?:Requirement|Scenario):/i.test(heading[2]);
			if (isNormativeHeading) excludedHeadingLevel = excludedHeadingLevel === null ? level : Math.min(excludedHeadingLevel, level);
			else if (excludedHeadingLevel !== null && level <= excludedHeadingLevel) excludedHeadingLevel = null;
		}
		if (excludedHeadingLevel !== null) {
			flush();
			continue;
		}

		const exception = parseException(line, file, lineNumber);
		if (exception) {
			flush();
			if (pendingException) throw new Error(`${file}:${pendingException.sourceLine}: STE review exception has no following reviewable prose`);
			pendingException = exception;
			continue;
		}

		const prose = proseOnly(line);
		if (!prose || /^[-:|\s]+$/.test(prose)) {
			flush();
			continue;
		}

		if (/^\s*\{[\s\S]*\}\s*$/.test(line)) {
			flush();
			continue;
		}

		const isHeading = /^\s*#{1,6}\s+/.test(line);
		const isList = /^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line);
		const isTable = /^\s*\|/.test(line);
		const isQuote = /^\s*>\s?/.test(line);
		if (isHeading) add(prose, lineNumber, 'heading', false);
		else if (isTable) add(prose, lineNumber, 'table', false);
		else if (isList) add(prose, lineNumber, 'list', false);
		else if (isQuote) add(prose, lineNumber, 'quote', activeKind === 'quote');
		else if (activeKind === 'list' && /^\s{2,}\S/.test(line)) add(prose, lineNumber, 'list', true);
		else add(prose, lineNumber, 'paragraph', activeKind === 'paragraph');
	}
	flush();
	if (pendingException) throw new Error(`${file}:${pendingException.sourceLine}: STE review exception has no following reviewable prose`);
	return { blocks, exceptions };
}

export function reviewDocument(source, file = '<input>') {
	const { blocks, exceptions } = collectProse(source, file);
	const results = [];
	const explained = new Set();
	const passivePattern = /\b(?:am|are|is|was|were|be|been|being)\s+(?:(?:\w+|not)\s+){0,2}(?:\w+(?:ed|en)|built|set)\b/i;

	for (const block of blocks) {
		for (const term of explanationTerms(block.text)) explained.add(term);
		for (const sentence of sentenceSpans(block)) {
			const count = wordCount(sentence.text);
			if (count > SENTENCE_WORD_LIMIT) {
				results.push(candidate(file, sentence.line, 'sentence-length', `sentence has ${count} words; review against the ${SENTENCE_WORD_LIMIT}-word candidate limit`));
			}
			if (passivePattern.test(sentence.text)) {
				results.push(candidate(file, sentence.line, 'passive-voice', 'possible passive voice; confirm the actor and action'));
			}
			const seen = new Set();
			for (const match of sentence.text.matchAll(/\b[A-Z][A-Z0-9]+(?:[.-][A-Z0-9]+)*\b/g)) {
				const token = match[0];
				if (seen.has(token) || APPROVED_TERMS.has(token) || explained.has(token)) continue;
				seen.add(token);
				results.push(candidate(file, sentence.line, 'unexplained-abbreviation', `explain ${token} at first use or approve it as a Beskid technical term`, token));
			}
			for (const token of articleCandidates(sentence.text)) {
				results.push(candidate(file, sentence.line, 'article', `review the indefinite article in “${token}”`, token));
			}
		}
	}

	for (const exception of exceptions) {
		for (const rule of exception.rules) {
			if (!results.some((item) => item.line === exception.targetLine && item.rule === rule)) {
				throw new Error(`${file}:${exception.sourceLine}: unused suppression: ${rule}`);
			}
		}
	}
	const filtered = results.filter((item) => !exceptions.some((exception) => exception.targetLine === item.line && exception.rules.has(item.rule)));

	return filtered.sort((left, right) => left.line - right.line || (RULE_ORDER.get(left.rule) ?? 99) - (RULE_ORDER.get(right.rule) ?? 99) || left.message.localeCompare(right.message));
}

async function markdownFiles(inputPath) {
	const details = await lstat(inputPath);
	if (details.isSymbolicLink()) return [];
	if (details.isFile()) return /\.mdx?$/.test(inputPath) ? [inputPath] : [];
	if (!details.isDirectory()) return [];
	const entries = await readdir(inputPath, { withFileTypes: true });
	const files = await Promise.all(entries.map((entry) => markdownFiles(path.join(inputPath, entry.name))));
	return files.flat();
}

export async function reviewPaths(inputPaths) {
	const files = [...new Set((await Promise.all(inputPaths.map((inputPath) => markdownFiles(path.resolve(inputPath))))).flat())].sort();
	const reviewed = await Promise.all(files.map(async (file) => reviewDocument(await readFile(file, 'utf8'), file)));
	return reviewed.flat().sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || (RULE_ORDER.get(left.rule) ?? 99) - (RULE_ORDER.get(right.rule) ?? 99));
}

async function main() {
	const inputs = process.argv.slice(2);
	const paths = inputs.length > 0 ? inputs : [fileURLToPath(DEFAULT_DOCS_ROOT)];
	const candidates = await reviewPaths(paths);
	for (const item of candidates) {
		const displayPath = path.relative(process.cwd(), item.file) || path.basename(item.file);
		process.stdout.write(`${displayPath}:${item.line} [${item.rule}] ${item.message}\n`);
	}
	process.stdout.write(`${candidates.length} candidate${candidates.length === 1 ? '' : 's'} for manual review. This tool does not certify ASD-STE100 compliance.\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
	main().catch((error) => {
		process.stderr.write(`${error.message}\n`);
		process.exitCode = 1;
	});
}

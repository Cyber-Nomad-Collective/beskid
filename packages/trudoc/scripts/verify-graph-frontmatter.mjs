import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import YAML from 'yaml';
import { getWebsiteRoot } from './lib/website-root.mjs';

const SITE_ROOT = getWebsiteRoot(import.meta.url);
const DOCS_ROOT = path.join(SITE_ROOT, 'src', 'content', 'docs');

function isObject(v) {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function walkFiles(dir) {
	const out = [];
	for (const name of fs.readdirSync(dir)) {
		const full = path.join(dir, name);
		const st = fs.statSync(full);
		if (st.isDirectory()) out.push(...walkFiles(full));
		else if (/\.(md|mdx)$/i.test(name)) out.push(full);
	}
	return out;
}

function readFrontmatter(filePath) {
	const text = fs.readFileSync(filePath, 'utf8');
	if (!text.startsWith('---\n')) return null;
	const end = text.indexOf('\n---\n', 4);
	if (end < 0) return null;
	const raw = text.slice(4, end);
	try {
		return YAML.parse(raw);
	} catch (err) {
		throw new Error(`Invalid YAML frontmatter: ${(err && err.message) || String(err)}`);
	}
}

function validatePlatformGraph(json, sourcePath) {
	const errors = [];
	if (!isObject(json)) return [`${sourcePath}: JSON root must be an object`];
	if (!Array.isArray(json.nodes)) errors.push(`${sourcePath}: nodes must be an array`);
	if (!Array.isArray(json.edges)) errors.push(`${sourcePath}: edges must be an array`);
	if (errors.length) return errors;
	for (const node of json.nodes) {
		if (!isObject(node) || typeof node.id !== 'string' || typeof node.label !== 'string') {
			errors.push(`${sourcePath}: each platform node needs string id and label`);
			break;
		}
		if (node.level != null && !['root', 'domain', 'area', 'feature'].includes(node.level)) {
			errors.push(`${sourcePath}: node level must be root|domain|area|feature`);
			break;
		}
	}
	for (const edge of json.edges) {
		if (!isObject(edge) || typeof edge.from !== 'string' || typeof edge.to !== 'string') {
			errors.push(`${sourcePath}: each platform edge needs string from and to`);
			break;
		}
	}
	return errors;
}

function validateArchitectureGraph(json, sourcePath) {
	const errors = [];
	if (!isObject(json)) return [`${sourcePath}: JSON root must be an object`];
	if (!Array.isArray(json.nodes)) errors.push(`${sourcePath}: nodes must be an array`);
	if (!Array.isArray(json.edges)) errors.push(`${sourcePath}: edges must be an array`);
	if (json.groups != null && !Array.isArray(json.groups)) errors.push(`${sourcePath}: groups must be an array if provided`);
	if (errors.length) return errors;
	for (const node of json.nodes) {
		if (!isObject(node) || typeof node.id !== 'string' || typeof node.label !== 'string') {
			errors.push(`${sourcePath}: each architecture node needs string id and label`);
			break;
		}
		if (node.group != null && typeof node.group !== 'string') {
			errors.push(`${sourcePath}: node.group must be a string when present`);
			break;
		}
	}
	for (const edge of json.edges) {
		if (!isObject(edge) || typeof edge.from !== 'string' || typeof edge.to !== 'string') {
			errors.push(`${sourcePath}: each architecture edge needs string from and to`);
			break;
		}
	}
	return errors;
}

function resolveSource(docPath, source) {
	if (typeof source !== 'string' || source.trim() === '') return null;
	const abs = path.resolve(SITE_ROOT, source);
	if (!abs.startsWith(SITE_ROOT)) throw new Error(`${docPath}: graph source escapes site root: ${source}`);
	return abs;
}

function validateFromSource(docPath, kind, sourceRel) {
	const abs = resolveSource(docPath, sourceRel);
	if (!abs) return [];
	if (!fs.existsSync(abs)) return [`${docPath}: missing ${kind}.source file: ${sourceRel}`];
	let parsed;
	try {
		parsed = JSON.parse(fs.readFileSync(abs, 'utf8'));
	} catch (err) {
		return [`${docPath}: invalid JSON in ${kind}.source ${sourceRel}: ${(err && err.message) || String(err)}`];
	}
	return kind === 'platformGraph'
		? validatePlatformGraph(parsed, sourceRel)
		: validateArchitectureGraph(parsed, sourceRel);
}

const docs = walkFiles(DOCS_ROOT);
const issues = [];
for (const filePath of docs) {
	const fm = readFrontmatter(filePath);
	if (!fm || !isObject(fm)) continue;
	const relDoc = path.relative(SITE_ROOT, filePath).replace(/\\/g, '/');

	if (isObject(fm.platformGraph) && fm.platformGraph.source) {
		issues.push(...validateFromSource(relDoc, 'platformGraph', fm.platformGraph.source));
	}
	if (isObject(fm.architectureGraph) && fm.architectureGraph.source) {
		issues.push(...validateFromSource(relDoc, 'architectureGraph', fm.architectureGraph.source));
	}
}

if (issues.length) {
	console.error('Graph frontmatter verification failed:\n');
	for (const issue of issues) console.error(`- ${issue}`);
	process.exit(1);
}

console.log(`Graph frontmatter verification passed (${docs.length} docs files scanned).`);

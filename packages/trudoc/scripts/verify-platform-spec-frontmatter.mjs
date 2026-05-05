/**
 * Ensures Markdown/MDX under src/content/docs/platform-spec/ declares
 * owner, submitter (name+email), specLevel, and status only on feature/article pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs', 'platform-spec');

const LEVELS = ['domain', 'area', 'component', 'feature', 'article'];
const STATUSES = ['Standard', 'Proposed'];
function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

function loadFrontmatter(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	if (!raw.startsWith('---')) return {};
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return {};
	const yaml = raw.slice(3, end).trim();
	try {
		return parseYaml(yaml) ?? {};
	} catch (e) {
		console.error(`Invalid YAML frontmatter: ${filePath}\n`, e.message);
		process.exit(1);
	}
}

function requirePerson(obj, label) {
	if (!obj || typeof obj !== 'object') return `${label} must be an object`;
	if (typeof obj.name !== 'string' || !obj.name.trim()) return `${label}.name required`;
	if (typeof obj.email !== 'string' || !obj.email.trim()) return `${label}.email required`;
	return null;
}

function classifyPath(filePath) {
	const normalized = filePath.split(path.sep).join('/');
	const marker = '/src/content/docs/platform-spec/';
	const index = normalized.indexOf(marker);
	if (index === -1) return null;
	const relative = normalized.slice(index + marker.length).replace(/\.(md|mdx)$/i, '');
	const segments = relative.split('/').filter(Boolean);
	const isIndex = segments.at(-1) === 'index';

	if (segments.length === 1 && isIndex) return 'domain-root';
	if (segments.length === 2 && isIndex) return 'domain';
	if (segments.length === 3 && isIndex) return 'area';
	if (segments.length === 4 && isIndex) return 'feature';
	if (segments.length >= 4 && !isIndex) return 'article';
	return 'legacy-or-bridge';
}

const files = walk(ROOT);
let failed = false;

for (const file of files) {
	const rel = path.relative(WEBSITE_ROOT, file);
	const data = loadFrontmatter(file);
	const errs = [];
	const level = data.specLevel;
	const pathLevel = classifyPath(file);
	if (!LEVELS.includes(level)) {
		errs.push(`specLevel must be one of: ${LEVELS.join(' | ')}`);
	}
	if (level === 'feature' || level === 'article') {
		if (!STATUSES.includes(data.status)) {
			errs.push(
				`status must be one of: ${STATUSES.join(' | ')} (required for specLevel: feature|article)`,
			);
		}
	} else if (data.status != null && data.status !== '') {
		errs.push('remove status (only feature/article pages carry lifecycle status)');
	}

	if (pathLevel === 'domain' && level !== 'domain') {
		errs.push('specLevel/path mismatch: expected domain for platform-spec/<domain>/index.mdx');
	}
	if (pathLevel === 'area' && level !== 'area') {
		errs.push('specLevel/path mismatch: expected area for platform-spec/<domain>/<area>/index.mdx');
	}
	if (pathLevel === 'feature' && level !== 'feature') {
		errs.push('specLevel/path mismatch: expected feature for platform-spec/<domain>/<area>/<feature>/index.mdx');
	}
	if (pathLevel === 'article' && level !== 'article') {
		errs.push(
			'specLevel/path mismatch: expected article for platform-spec/<domain>/<area>/<feature>/*.mdx (non-index)',
		);
	}
	const o = requirePerson(data.owner, 'owner');
	if (o) errs.push(o);
	const s = requirePerson(data.submitter, 'submitter');
	if (s) errs.push(s);
	const layoutDir = path.dirname(file);
	const layoutJson = path.join(layoutDir, 'layout.json');
	const needsLayout =
		pathLevel === 'domain-root' ||
		pathLevel === 'domain' ||
		pathLevel === 'area' ||
		pathLevel === 'feature';
	if (needsLayout && !fs.existsSync(layoutJson)) {
		errs.push(`missing layout.json (expected beside this hub): ${path.relative(WEBSITE_ROOT, layoutJson).replace(/\\/g, '/')}`);
	}

	if (errs.length) {
		failed = true;
		console.error(`\n[platform-spec] ${rel}:\n  - ${errs.join('\n  - ')}`);
	}
}

if (failed) {
	console.error('\nplatform-spec frontmatter verification failed.');
	process.exit(1);
}
if (files.length) {
	console.log(`platform-spec: verified ${files.length} file(s).`);
}

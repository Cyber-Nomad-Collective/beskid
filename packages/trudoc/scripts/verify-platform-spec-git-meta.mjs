import fs from 'node:fs';
import path from 'node:path';
import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const SPEC_ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs', 'platform-spec');
const META_FILE = path.join(WEBSITE_ROOT, 'src', 'generated', 'platform-spec-git-meta.json');

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

function main() {
	if (!fs.existsSync(META_FILE)) {
		console.error('verify-platform-spec-git-meta: missing', path.relative(WEBSITE_ROOT, META_FILE));
		process.exit(1);
	}
	const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
	const specFiles = walk(SPEC_ROOT);
	const missing = [];
	for (const abs of specFiles) {
		const websiteRelativePath = path.relative(WEBSITE_ROOT, abs).split(path.sep).join('/');
		if (!meta.files?.[websiteRelativePath]) missing.push(websiteRelativePath);
	}
	if (meta.gitAvailable && missing.length) {
		console.error(`verify-platform-spec-git-meta: ${missing.length} spec file(s) missing from git meta map:`);
		for (const m of missing) console.error(`  - ${m}`);
		process.exit(1);
	}
	if (!meta.gitAvailable) {
		console.log('verify-platform-spec-git-meta: skipped strict map check (git was unavailable at generation time).');
	} else {
		console.log('verify-platform-spec-git-meta: all platform-spec files present in git meta map.');
	}
}

main();

import fs from 'node:fs';
import path from 'node:path';
import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const ROOT = path.join(WEBSITE_ROOT, 'src', 'content', 'docs', 'platform-spec', 'language-meta');

const LEGACY_HEADINGS = new Set([
	'## Related (within language meta)',
	'## Cross-cutting links',
]);

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(fullPath, out);
			continue;
		}
		if (/\.(md|mdx)$/i.test(entry.name)) out.push(fullPath);
	}
	return out;
}

const files = walk(ROOT);
const offenders = [];

for (const filePath of files) {
	const raw = fs.readFileSync(filePath, 'utf8');
	const found = [...LEGACY_HEADINGS].filter((heading) => raw.includes(heading));
	if (!found.length) continue;

	const rel = path.relative(WEBSITE_ROOT, filePath);
	offenders.push({ rel, found });
}

if (offenders.length) {
	for (const offender of offenders) {
		console.error(`[language-meta] ${offender.rel}`);
		for (const heading of offender.found) {
			console.error(`  - remove legacy heading: "${heading}"`);
		}
	}
	console.error('\nlanguage-meta related links verification failed.');
	process.exit(1);
}

console.log(`language-meta: verified ${files.length} file(s), no legacy related-links sections found.`);

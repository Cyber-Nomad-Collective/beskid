import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolves the Beskid docs app root (`site/website`, where `package.json` name is `beskid-website`).
 * @see website-root.mjs for the same logic (used from .mjs scripts).
 */
export function getWebsiteRoot(fromImportMetaUrl: string): string {
	const env = process.env.BESKID_WEBSITE_ROOT?.trim();
	if (env) return path.resolve(env);

	const here = path.dirname(fileURLToPath(fromImportMetaUrl));
	let cur = here;
	for (let i = 0; i < 16; i++) {
		const candidate = path.join(cur, 'site', 'website');
		const pkg = path.join(candidate, 'package.json');
		if (fs.existsSync(pkg)) {
			try {
				const raw = JSON.parse(fs.readFileSync(pkg, 'utf8')) as { name?: string };
				if (raw.name === 'beskid-website') return candidate;
			} catch {
				/* continue */
			}
		}
		const atWebsite = path.join(cur, 'package.json');
		if (fs.existsSync(atWebsite)) {
			try {
				const raw = JSON.parse(fs.readFileSync(atWebsite, 'utf8')) as { name?: string };
				if (raw.name === 'beskid-website') return cur;
			} catch {
				/* continue */
			}
		}
		const parent = path.dirname(cur);
		if (parent === cur) break;
		cur = parent;
	}
	return process.cwd();
}

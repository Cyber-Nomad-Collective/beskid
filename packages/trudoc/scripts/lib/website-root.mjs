// Re-export for .mjs scripts (Node resolves sibling .mjs only — duplicate minimal API).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function getWebsiteRoot(importMetaUrl) {
	const env = process.env.BESKID_WEBSITE_ROOT?.trim();
	if (env) return path.resolve(env);
	const here = path.dirname(fileURLToPath(importMetaUrl));
	let cur = here;
	for (let i = 0; i < 16; i++) {
		const candidate = path.join(cur, 'site', 'website');
		const pkg = path.join(candidate, 'package.json');
		if (fs.existsSync(pkg)) {
			try {
				const raw = JSON.parse(fs.readFileSync(pkg, 'utf8'));
				if (raw.name === 'beskid-website') return candidate;
			} catch {}
		}
		const atWebsite = path.join(cur, 'package.json');
		if (fs.existsSync(atWebsite)) {
			try {
				const raw = JSON.parse(fs.readFileSync(atWebsite, 'utf8'));
				if (raw.name === 'beskid-website') return cur;
			} catch {}
		}
		const parent = path.dirname(cur);
		if (parent === cur) break;
		cur = parent;
	}
	return process.cwd();
}

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { platformSpecNodeSchema } from '../schema/content';

type PathLevel = 'domain-root' | 'domain' | 'area' | 'feature' | 'article' | 'legacy-or-bridge';

function walk(dir: string, out: string[] = []): string[] {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

function loadFrontmatter(filePath: string): Record<string, unknown> {
	const raw = fs.readFileSync(filePath, 'utf8');
	if (!raw.startsWith('---')) return {};
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return {};
	const yaml = raw.slice(3, end).trim();
	return (parseYaml(yaml) as Record<string, unknown> | null) ?? {};
}

function classifyPath(filePath: string): PathLevel | null {
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

function requireLayoutJson(websiteRoot: string, filePath: string, pathLevel: PathLevel): string[] {
	const errs: string[] = [];
	const layoutDir = path.dirname(filePath);
	const layoutJson = path.join(layoutDir, 'layout.json');
	const needsLayout =
		pathLevel === 'domain-root' ||
		pathLevel === 'domain' ||
		pathLevel === 'area' ||
		pathLevel === 'feature';
	if (needsLayout && !fs.existsSync(layoutJson)) {
		errs.push(
			`PSF009 missing layout.json beside hub: ${path.relative(websiteRoot, layoutJson).replace(/\\/g, '/')}`,
		);
	}
	return errs;
}

function validatePathLevel(pathLevel: PathLevel, frontmatter: Record<string, unknown>): string[] {
	const errs: string[] = [];
	const level = frontmatter.specLevel;

	if (!['domain', 'area', 'component', 'feature', 'article'].includes(String(level))) {
		errs.push('PSF001 specLevel must be one of: domain | area | component | feature | article');
		return errs;
	}

	if (pathLevel === 'domain' && level !== 'domain') {
		errs.push('PSF002 specLevel/path mismatch: expected domain for platform-spec/<domain>/index.mdx');
	}
	if (pathLevel === 'area' && level !== 'area') {
		errs.push('PSF003 specLevel/path mismatch: expected area for platform-spec/<domain>/<area>/index.mdx');
	}
	if (pathLevel === 'feature' && level !== 'feature') {
		errs.push(
			'PSF004 specLevel/path mismatch: expected feature for platform-spec/<domain>/<area>/<feature>/index.mdx',
		);
	}
	if (pathLevel === 'article' && level !== 'article') {
		errs.push(
			'PSF005 specLevel/path mismatch: expected article for platform-spec/<domain>/<area>/<feature>/*.mdx (non-index)',
		);
	}

	return errs;
}

function validateNodeSchema(frontmatter: Record<string, unknown>): string[] {
	const level = frontmatter.specLevel;
	if (level !== 'domain' && level !== 'area' && level !== 'feature' && level !== 'article') {
		return [];
	}
	const parsed = platformSpecNodeSchema.safeParse(frontmatter);
	if (parsed.success) return [];
	return parsed.error.issues.map((issue) => {
		const pathHint = issue.path.join('.') || 'frontmatter';
		return `PSF010 ${pathHint}: ${issue.message}`;
	});
}

export function verifyPlatformSpecFrontmatter(websiteRoot: string): void {
	const root = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
	const files = walk(root);
	let failed = false;

	for (const file of files) {
		const rel = path.relative(websiteRoot, file);
		const pathLevel = classifyPath(file);
		if (!pathLevel) continue;

		let frontmatter: Record<string, unknown>;
		try {
			frontmatter = loadFrontmatter(file);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			console.error(`\n[platform-spec] ${rel}:\n  - PSF011 invalid YAML frontmatter: ${msg}`);
			failed = true;
			continue;
		}

		const errs = [
			...validatePathLevel(pathLevel, frontmatter),
			...validateNodeSchema(frontmatter),
			...requireLayoutJson(websiteRoot, file, pathLevel),
		];
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
}

export const platformSpecFrontmatterIssueSchema = z.object({
	code: z.string(),
	message: z.string(),
	path: z.string().optional(),
});

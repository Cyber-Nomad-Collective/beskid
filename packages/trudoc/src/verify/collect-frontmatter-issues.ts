import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { platformSpecNodeSchema } from '../schema/content';

type PathLevel =
	| 'domain-root'
	| 'domain'
	| 'area'
	| 'feature'
	| 'article'
	| 'adr'
	| 'legacy-or-bridge';

export type PlatformSpecFrontmatterIssue = {
	code: string;
	severity: 'error' | 'warn';
	file: string;
	message: string;
};

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
	return (parseYaml(raw.slice(3, end).trim()) as Record<string, unknown> | null) ?? {};
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
	if (segments.length >= 5 && segments.at(-2) === 'adr' && !isIndex) return 'adr';
	if (segments.length === 3 && !isIndex) return 'article';
	if (segments.length >= 4 && !isIndex && segments.at(-2) !== 'adr') return 'article';
	return 'legacy-or-bridge';
}

function specRel(filePath: string, websiteRoot: string): string {
	const root = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
	return path.relative(root, filePath).split(path.sep).join('/');
}

function requireLayoutJson(
	websiteRoot: string,
	filePath: string,
	pathLevel: PathLevel,
): string[] {
	const layoutJson = path.join(path.dirname(filePath), 'layout.json');
	const needsLayout =
		pathLevel === 'domain-root' ||
		pathLevel === 'domain' ||
		pathLevel === 'area' ||
		pathLevel === 'feature';
	if (needsLayout && !fs.existsSync(layoutJson)) {
		return [
			`PSF009 missing layout.json beside hub: ${path.relative(websiteRoot, layoutJson).replace(/\\/g, '/')}`,
		];
	}
	return [];
}

function validatePathLevel(pathLevel: PathLevel, frontmatter: Record<string, unknown>): string[] {
	const errs: string[] = [];
	const level = frontmatter.specLevel;

	if (!['domain', 'area', 'component', 'feature', 'article', 'adr'].includes(String(level))) {
		errs.push('PSF001 specLevel must be one of: domain | area | component | feature | article | adr');
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
			'PSF005 specLevel/path mismatch: expected article for platform-spec area or feature child *.mdx (non-index)',
		);
	}
	if (pathLevel === 'adr' && level !== 'adr') {
		errs.push(
			'PSF006 specLevel/path mismatch: expected adr for platform-spec/<domain>/<area>/<feature>/adr/<name>.mdx',
		);
	}

	return errs;
}

function validateNodeSchema(frontmatter: Record<string, unknown>): string[] {
	const level = frontmatter.specLevel;
	if (level !== 'domain' && level !== 'area' && level !== 'feature' && level !== 'article' && level !== 'adr') {
		return [];
	}
	const parsed = platformSpecNodeSchema.safeParse(frontmatter);
	if (parsed.success) return [];
	return parsed.error.issues.map((issue) => {
		const pathHint = issue.path.join('.') || 'frontmatter';
		return `PSF010 ${pathHint}: ${issue.message}`;
	});
}

function parseIssueMessage(msg: string): { code: string; message: string } {
	const space = msg.indexOf(' ');
	if (space === -1) return { code: 'PSF', message: msg };
	return { code: msg.slice(0, space), message: msg.slice(space + 1) };
}

/**
 * Collect frontmatter validation issues for platform-spec files (non-exiting).
 */
export function collectPlatformSpecFrontmatterIssues(
	websiteRoot: string,
	filterRelPaths?: Set<string>,
): PlatformSpecFrontmatterIssue[] {
	const root = path.join(websiteRoot, 'src', 'content', 'docs', 'platform-spec');
	const files = walk(root);
	const issues: PlatformSpecFrontmatterIssue[] = [];

	for (const file of files) {
		const rel = specRel(file, websiteRoot);
		if (filterRelPaths && !filterRelPaths.has(rel)) continue;

		const pathLevel = classifyPath(file);
		if (!pathLevel || pathLevel === 'legacy-or-bridge') continue;

		let frontmatter: Record<string, unknown>;
		try {
			frontmatter = loadFrontmatter(file);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			issues.push({
				code: 'PSF011',
				severity: 'error',
				file: rel,
				message: `invalid YAML frontmatter: ${msg}`,
			});
			continue;
		}

		const errs = [
			...validatePathLevel(pathLevel, frontmatter),
			...validateNodeSchema(frontmatter),
			...requireLayoutJson(websiteRoot, file, pathLevel),
		];

		for (const err of errs) {
			const { code, message } = parseIssueMessage(err);
			issues.push({ code, severity: 'error', file: rel, message });
		}
	}

	return issues;
}

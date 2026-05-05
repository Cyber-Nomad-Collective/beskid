import fs from 'node:fs';
import path from 'node:path';

/** Normalize URL pathname segment to docs slug (no leading slash). */
export function slugFromPathname(pathname: string): string {
	return pathname.replace(/^\/+|\/+$/g, '').replace(/\/index\/?$/i, '');
}

/**
 * Path of the doc file relative to `site/website`, e.g. `src/content/docs/platform-spec/foo/index.mdx`.
 */
export function websiteRelativeDocPath(websiteRoot: string, slug: string): string | null {
	const docs = path.join(websiteRoot, 'src', 'content', 'docs');
	const norm = slugFromPathname(slug);
	const candidates = [
		path.join(docs, `${norm}.mdx`),
		path.join(docs, `${norm}.md`),
		path.join(docs, norm, 'index.mdx'),
		path.join(docs, norm, 'index.md'),
	];
	for (const c of candidates) {
		if (fs.existsSync(c)) return path.relative(websiteRoot, c).split(path.sep).join('/');
	}
	return null;
}

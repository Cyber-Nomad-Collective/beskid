/**
 * Content manifest — the single source of truth for the website's MDX/MD
 * corpus.
 *
 * `import.meta.glob` eagerly imports every `.mdx`/`.md` file under
 * `src/content/`. The `@mdx-js/rollup` plugin compiles each file into a React
 * component (default export) and `remark-mdx-frontmatter` exposes the YAML
 * frontmatter as a named `frontmatter` export.
 *
 * Slugs map 1:1 to URL paths:
 *   src/content/book/00-why-beskid-exists/index.md          → book/00-why-beskid-exists
 *   src/content/book/00-why-beskid-exists/whats-in-the-name → book/00-why-beskid-exists/whats-in-the-name
 *   src/content/blog/v0-4-04-platform-not-compiler.md       → blog/v0-4-04-platform-not-compiler
 *
 * `index` files collapse to their directory slug.
 */

import type { ComponentType } from "react";

export interface ContentFrontmatter {
	title?: string;
	description?: string;
	date?: string;
	blogStatus?: "released" | "truncated" | "in-progress";
	release?: string;
	tableOfContents?: boolean;
	[key: string]: unknown;
}

export interface ContentEntry {
	/** Route slug, e.g. `book/00-why-beskid-exists`. */
	slug: string;
	/** Compiled MDX component. */
	Component: ComponentType<Record<string, never>>;
	/** Parsed YAML frontmatter. */
	frontmatter: ContentFrontmatter;
	/** Source file path (relative to `src/content/`). */
	relativePath: string;
	/** Section: `book` or `blog`. */
	section: "book" | "blog";
}

type GlobModule = {
	default: ComponentType<Record<string, never>>;
	frontmatter: ContentFrontmatter;
};

// Eager imports so the manifest is a static map at build time (SSR + client).
const modules = import.meta.glob<GlobModule>("../content/**/*.{md,mdx}", {
	eager: true,
});

function slugFromPath(relativePath: string): string {
	// Strip extension.
	const noExt = relativePath.replace(/\.(mdx|md)$/, "");
	// Collapse trailing `/index` to the directory.
	return noExt.replace(/\/index$/, "");
}

function sectionFromSlug(slug: string): "book" | "blog" {
	return slug.startsWith("book/") ? "book" : "blog";
}

/** All content entries, keyed by slug. */
export const contentEntries: Record<string, ContentEntry> = Object.fromEntries(
	Object.entries(modules).map(([filePath, mod]) => {
		const relativePath = filePath
			.replace(/^\.\.\//, "")
			.replace(/^content\//, "");
		const slug = slugFromPath(relativePath);
		return [
			slug,
			{
				slug,
				Component: mod.default,
				frontmatter: mod.frontmatter ?? {},
				relativePath,
				section: sectionFromSlug(slug),
			},
		];
	}),
);

export function getContentEntry(slug: string): ContentEntry | null {
	return contentEntries[slug] ?? null;
}

export interface BookChapterEntry {
	slug: string;
	title: string;
	description?: string;
}

/**
 * Top-level book chapters (the 22 tutorial chapters + reference + appendix).
 * Derived from the manifest by listing entries whose slug is exactly
 * `book/<chapter-dir>` (i.e. the chapter's `index.md`).
 */
export const bookChapters: BookChapterEntry[] = Object.values(contentEntries)
	.filter(
		(entry) =>
			entry.section === "book" &&
			/^book\/[^/]+$/.test(entry.slug) &&
			entry.slug !== "book",
	)
	.map((entry) => ({
		slug: entry.slug,
		title: entry.frontmatter.title ?? entry.slug,
		description: entry.frontmatter.description,
	}))
	.sort((a, b) => a.slug.localeCompare(b.slug));

export interface BlogPostEntry {
	slug: string;
	title: string;
	description?: string;
	date?: string;
	blogStatus?: "released" | "truncated" | "in-progress";
	release?: string;
}

/**
 * All blog posts, sorted newest-first by frontmatter `date`.
 */
export const blogPosts: BlogPostEntry[] = Object.values(contentEntries)
	.filter((entry) => entry.section === "blog")
	.map((entry) => ({
		slug: entry.slug,
		title: entry.frontmatter.title ?? entry.slug,
		description: entry.frontmatter.description,
		date: entry.frontmatter.date,
		blogStatus: entry.frontmatter.blogStatus,
		release: entry.frontmatter.release,
	}))
	.sort((a, b) => {
		const aTime = a.date ? Date.parse(a.date) : 0;
		const bTime = b.date ? Date.parse(b.date) : 0;
		if (bTime !== aTime) return bTime - aTime;
		return a.slug.localeCompare(b.slug);
	});

/**
 * Ordered list of book content slugs within a chapter, for prev/next nav.
 */
export function chapterPages(chapterSlug: string): string[] {
	const prefix = `${chapterSlug}/`;
	return Object.keys(contentEntries)
		.filter((slug) => slug === chapterSlug || slug.startsWith(prefix))
		.sort((a, b) => a.localeCompare(b));
}

/**
 * Prev/next navigation for a content slug within its ordered sibling list.
 */
export function prevNextSlugs(slug: string): {
	prev: string | null;
	next: string | null;
} {
	const chapterSlug = slug.includes("/")
		? slug.split("/").slice(0, 2).join("/")
		: slug;
	const pages = chapterPages(chapterSlug);
	const idx = pages.indexOf(slug);
	if (idx === -1) return { prev: null, next: null };
	return {
		prev: idx > 0 ? pages[idx - 1] : null,
		next: idx < pages.length - 1 ? pages[idx + 1] : null,
	};
}

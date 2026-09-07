/**
 * Layout for book content pages — renders the MDX body with a prose wrapper,
 * a title header, and prev/next navigation across the chapter's pages.
 */

import { Link } from "@tanstack/react-router";
import { MdxRenderer } from "#/components/mdx-renderer";
import type { ContentEntry } from "#/lib/content-manifest";
import { getContentEntry, prevNextSlugs } from "#/lib/content-manifest";

interface BookLayoutProps {
	entry: ContentEntry;
}

/** Strip the leading `book/` from a content slug to get the splat param. */
function splatOf(slug: string): string {
	return slug.replace(/^book\//, "");
}

export function BookLayout({ entry }: BookLayoutProps) {
	const { prev, next } = prevNextSlugs(entry.slug);
	const title = entry.frontmatter.title ?? entry.slug;
	const description = entry.frontmatter.description;

	return (
		<article className="beskid-prose">
			<header>
				<p className="beskid-landing__eyebrow">
					<Link to="/book">The Beskid Book</Link>
				</p>
				<h1>{title}</h1>
				{description && <p className="beskid-prose__lead">{description}</p>}
			</header>

			<div className="beskid-prose__body">
				<MdxRenderer Component={entry.Component} />
			</div>

			{(prev || next) && (
				<nav className="beskid-doc-nav" aria-label="Chapter navigation">
					<div>
						{prev && (
							<Link to="/book/$" params={{ _splat: splatOf(prev) }}>
								<span className="beskid-doc-nav__label">Previous</span>
								{contentTitle(prev)}
							</Link>
						)}
					</div>
					<div>
						{next && (
							<Link to="/book/$" params={{ _splat: splatOf(next) }}>
								<span className="beskid-doc-nav__label">Next</span>
								{contentTitle(next)}
							</Link>
						)}
					</div>
				</nav>
			)}
		</article>
	);
}

function contentTitle(slug: string): string {
	const entry = getContentEntry(slug);
	return entry?.frontmatter.title ?? slug;
}

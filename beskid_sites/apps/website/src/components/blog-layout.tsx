/**
 * Layout for blog posts — renders the MDX body with a post header (date,
 * status badge, release) and a back-link to the blog index.
 */

import { Link } from "@tanstack/react-router";
import { MdxRenderer } from "#/components/mdx-renderer";
import type { ContentEntry } from "#/lib/content-manifest";

interface BlogLayoutProps {
	entry: ContentEntry;
}

const STATUS_LABELS: Record<string, string> = {
	released: "Published",
	truncated: "Truncated",
	"in-progress": "In progress",
};

function formatDate(raw: string): string {
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return raw;
	return new Intl.DateTimeFormat("en", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(d);
}

export function BlogLayout({ entry }: BlogLayoutProps) {
	const title = entry.frontmatter.title ?? entry.slug;
	const description = entry.frontmatter.description;
	const date = entry.frontmatter.date;
	const status = entry.frontmatter.blogStatus;
	const release = entry.frontmatter.release;

	return (
		<article className="beskid-prose">
			<header>
				<p className="beskid-landing__eyebrow">
					<Link to="/blog">Blog</Link>
				</p>
				<h1>{title}</h1>
				{description && <p className="beskid-prose__lead">{description}</p>}
				{(date || status || release) && (
					<p className="beskid-card__meta">
						{date && <time dateTime={date}>{formatDate(date)}</time>}
						{status && (
							<span className={`beskid-badge beskid-badge--${status}`}>
								{STATUS_LABELS[status] ?? status}
							</span>
						)}
						{release && <span>{release}</span>}
					</p>
				)}
			</header>

			<div className="beskid-prose__body">
				<MdxRenderer Component={entry.Component} />
			</div>
		</article>
	);
}

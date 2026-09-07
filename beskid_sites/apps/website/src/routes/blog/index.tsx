import { createFileRoute, Link } from "@tanstack/react-router";
import { blogPosts } from "#/lib/content-manifest";

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

function BlogIndexPage() {
	const [featured, ...archive] = blogPosts;

	return (
		<div className="beskid-index">
			<header>
				<p className="beskid-index__eyebrow">Blog</p>
				<h1 className="beskid-index__title">The work behind Beskid</h1>
				<p className="beskid-index__lead">
					Release notes, engineering essays, and design records. Read what shipped,
					what changed our minds, and what remains unfinished.
				</p>
			</header>

			{featured && (
				<Link
					to="/blog/$"
					params={{ _splat: featured.slug.replace(/^blog\//, "") }}
					className="beskid-card"
				>
					<p className="beskid-card__meta">
						{featured.date && (
							<time dateTime={featured.date}>{formatDate(featured.date)}</time>
						)}
						{featured.blogStatus && (
							<span className={`beskid-badge beskid-badge--${featured.blogStatus}`}>
								{STATUS_LABELS[featured.blogStatus] ?? featured.blogStatus}
							</span>
						)}
						{featured.release && <span>{featured.release}</span>}
					</p>
					<p className="beskid-card__title">{featured.title}</p>
					{featured.description && (
						<p className="beskid-card__desc">{featured.description}</p>
					)}
				</Link>
			)}

			<h2 className="beskid-landing__section-title" style={{ marginTop: "3rem" }}>
				All posts
			</h2>
			<p className="beskid-index__lead">{archive.length} posts, newest first.</p>

			<ol className="beskid-card-list">
				{archive.map((post) => (
					<li key={post.slug}>
						<Link
							to="/blog/$"
							params={{ _splat: post.slug.replace(/^blog\//, "") }}
							className="beskid-card"
						>
							<p className="beskid-card__meta">
								{post.date && <time dateTime={post.date}>{formatDate(post.date)}</time>}
								{post.blogStatus && (
									<span className={`beskid-badge beskid-badge--${post.blogStatus}`}>
										{STATUS_LABELS[post.blogStatus] ?? post.blogStatus}
									</span>
								)}
							</p>
							<p className="beskid-card__title">{post.title}</p>
							{post.description && (
								<p className="beskid-card__desc">{post.description}</p>
							)}
						</Link>
					</li>
				))}
			</ol>
		</div>
	);
}

export const Route = createFileRoute("/blog/")({
	component: BlogIndexPage,
});

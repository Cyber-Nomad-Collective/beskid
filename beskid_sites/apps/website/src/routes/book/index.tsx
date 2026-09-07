import { createFileRoute, Link } from "@tanstack/react-router";
import { bookChapters } from "#/lib/content-manifest";

function BookIndexPage() {
	return (
		<div className="beskid-index">
			<header>
				<p className="beskid-index__eyebrow">The Beskid Book</p>
				<h1 className="beskid-index__title">
					A practical language tutorial for Beskid
				</h1>
				<p className="beskid-index__lead">
					From first install to contributing across the platform. Written as a
					tutorial track first, with links into the normative spec when you want
					exact rules.
				</p>
			</header>

			<ol className="beskid-card-list">
				{bookChapters.map((chapter) => (
					<li key={chapter.slug}>
						<Link
							to="/book/$"
							params={{ _splat: chapter.slug.replace(/^book\//, "") }}
							className="beskid-card"
						>
							<p className="beskid-card__title">{chapter.title}</p>
							{chapter.description && (
								<p className="beskid-card__desc">{chapter.description}</p>
							)}
						</Link>
					</li>
				))}
			</ol>
		</div>
	);
}

export const Route = createFileRoute("/book/")({
	component: BookIndexPage,
});

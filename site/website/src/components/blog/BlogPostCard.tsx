export type BlogPostCardProps = {
	title: string;
	description: string;
	href: string;
	date: string;
	dateTime: string;
	release?: string;
	image?: { src: string; alt: string; sourceHref: string; sourceLabel: string };
	variant: "recent" | "compact";
};

/** Static React island: reusable editorial tile with a visible source link. */
export function BlogPostCard({
	title,
	description,
	href,
	date,
	dateTime,
	release,
	image,
	variant,
}: BlogPostCardProps) {
	return (
		<article className={`blog-card blog-card--${variant}`}>
			{image && <figure className="blog-card__figure">
				<a className="blog-card__image" href={href} tabIndex={-1} aria-hidden="true">
					<img src={image.src} alt={image.alt} loading="lazy" />
				</a>
				<figcaption><a href={image.sourceHref}>Image: {image.sourceLabel}</a></figcaption>
			</figure>}
			<div className="blog-card__body">
				<div className="blog-card__meta"><time dateTime={dateTime}>{date}</time>{release && <span>{release}</span>}</div>
				<h2><a href={href}>{title}</a></h2>
				<p>{description}</p>
				<div className="blog-card__footer"><a href={href}>Read the post <span aria-hidden="true">→</span></a></div>
			</div>
		</article>
	);
}

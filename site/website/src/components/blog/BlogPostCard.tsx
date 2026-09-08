export type BlogPostCardProps = {
	title: string;
	description: string;
	href: string;
	date: string;
	dateTime: string;
	status: string;
	release?: string;
	image: { src: string; alt: string; sourceHref: string; sourceLabel: string };
};

/** Static React island: reusable editorial tile with a visible source link. */
export function BlogPostCard({
	title,
	description,
	href,
	date,
	dateTime,
	status,
	release,
	image,
}: BlogPostCardProps) {
	return (
		<article className="blog-card">
			<a className="blog-card__image" href={href} tabIndex={-1} aria-hidden="true">
				<img src={image.src} alt={image.alt} loading="lazy" />
			</a>
			<div className="blog-card__body">
				<div className="blog-card__meta"><time dateTime={dateTime}>{date}</time><span>{status}</span></div>
				<h2><a href={href}>{title}</a></h2>
				<p>{description}</p>
				<div className="blog-card__footer"><span>{release}</span><a href={href}>Read post <span aria-hidden="true">→</span></a></div>
				<a className="blog-card__source" href={image.sourceHref}>Image: {image.sourceLabel}</a>
			</div>
		</article>
	);
}

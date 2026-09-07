/**
 * React replacements for the Astro-specific components used in the
 * migrated MDX corpus. These are provided to rendered MDX via an
 * `<MDXProvider components={...}>` wrapper (see `mdx-renderer.tsx`), so the
 * `.mdx`/`.md` files do not need their own imports.
 */

import type { ReactNode } from "react";

export type AsideType = "note" | "tip" | "caution" | "danger";

const ASIDE_TITLES: Record<AsideType, string> = {
	note: "Note",
	tip: "Tip",
	caution: "Caution",
	danger: "Danger",
};

export interface AsideProps {
	type?: AsideType;
	title?: string;
	children: ReactNode;
}

/**
 * Callout box — replaces `@astrojs/starlight/components` `Aside`.
 * Renders with a colored left border keyed by `type`.
 */
export function Aside({ type = "note", title, children }: AsideProps) {
	const label = title ?? ASIDE_TITLES[type];
	return (
		<aside className={`beskid-aside beskid-aside--${type}`}>
			<p className="beskid-aside__title">{label}</p>
			<div className="beskid-aside__body">{children}</div>
		</aside>
	);
}

export interface YouTubeProps {
	/** Full YouTube URL or just the video id. */
	id: string;
	title?: string;
}

function youTubeVideoId(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	// Bare id (11 chars, no slashes).
	if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
	try {
		const url = new URL(trimmed);
		if (url.hostname === "youtu.be") return url.pathname.slice(1);
		const v = url.searchParams.get("v");
		if (v) return v;
	} catch {
		// fall through
	}
	return trimmed;
}

/**
 * Responsive 16:9 YouTube embed — replaces `astro-embed`'s `YouTube`.
 */
export function YouTube({ id, title }: YouTubeProps) {
	const videoId = youTubeVideoId(id);
	if (!videoId) return null;
	const src = `https://www.youtube-nocookie.com/embed/${videoId}`;
	return (
		<div className="beskid-youtube">
			<iframe
				src={src}
				title={title ?? "YouTube video"}
				loading="lazy"
				allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
			/>
		</div>
	);
}

/**
 * MDX component map consumed by `<MDXProvider>`. Every Astro-specific
 * component name used in the corpus is mapped to its React replacement.
 */
export const mdxComponents = {
	Aside,
	YouTube,
};

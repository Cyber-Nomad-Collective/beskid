import { createFileRoute, notFound } from "@tanstack/react-router";
import { BlogLayout } from "#/components/blog-layout";
import { getContentEntry } from "#/lib/content-manifest";

/**
 * Splat route for `/blog/*`. The loader resolves the content slug and returns
 * only the serializable slug (the compiled MDX `Component` is a function that
 * seroval cannot serialize across the SSR boundary, so the route component
 * re-resolves the entry from the bundled manifest on render).
 *
 * `/blog/v0-4-04-platform-not-compiler` → slug `blog/v0-4-04-platform-not-compiler`
 */
export const Route = createFileRoute("/blog/$")({
	loader: async ({ params }) => {
		const splat = (params._splat ?? "").replace(/^\/+|\/+$/g, "");
		if (!splat) {
			throw notFound();
		}
		const slug = `blog/${splat}`;
		const entry = getContentEntry(slug);
		if (!entry) {
			throw notFound();
		}
		return { slug, title: entry.frontmatter.title ?? slug };
	},
	component: BlogPage,
});

function BlogPage() {
	const { slug } = Route.useLoaderData();
	const entry = getContentEntry(slug);
	if (!entry) {
		throw notFound();
	}
	return <BlogLayout entry={entry} />;
}

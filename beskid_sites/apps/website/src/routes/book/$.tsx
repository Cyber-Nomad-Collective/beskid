import { createFileRoute, notFound } from "@tanstack/react-router";
import { BookLayout } from "#/components/book-layout";
import { getContentEntry } from "#/lib/content-manifest";

/**
 * Splat route for `/book/*`. The loader resolves the content slug and
 * returns only the serializable slug (the compiled MDX `Component` is a
 * function that seroval cannot serialize across the SSR boundary, so the
 * route component re-resolves the entry from the bundled manifest on render).
 *
 * `/book/00-why-beskid-exists`                   → slug `book/00-why-beskid-exists`
 * `/book/00-why-beskid-exists/whats-in-the-name` → slug `book/00-why-beskid-exists/whats-in-the-name`
 * `/book/reference/cli`                          → slug `book/reference/cli`
 */
export const Route = createFileRoute("/book/$")({
	loader: async ({ params }) => {
		const splat = (params._splat ?? "").replace(/^\/+|\/+$/g, "");
		if (!splat) {
			throw notFound();
		}
		const slug = `book/${splat}`;
		const entry = getContentEntry(slug);
		if (!entry) {
			throw notFound();
		}
		// Return only serializable data — the Component is resolved in the
		// component via getContentEntry to avoid seroval function-serialization.
		return { slug, title: entry.frontmatter.title ?? slug };
	},
	component: BookPage,
});

function BookPage() {
	const { slug } = Route.useLoaderData();
	const entry = getContentEntry(slug);
	if (!entry) {
		throw notFound();
	}
	return <BookLayout entry={entry} />;
}

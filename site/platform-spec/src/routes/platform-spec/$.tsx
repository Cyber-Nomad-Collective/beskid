import { createFileRoute, notFound } from "@tanstack/react-router";

import { ReaderChrome } from "#/components/reader/reader-chrome";
import { SpecShell } from "#/components/reader/spec-shell";
import { StructuredDocumentView } from "#/components/reader/structured-document-view";
import {
	fetchCatalog,
	fetchDocumentBySlug,
	fetchNavTree,
} from "#/server/catalog";

// Run `pnpm dev` to regenerate routeTree.gen.ts after route changes.
export const Route = createFileRoute("/platform-spec/$")({
	loader: async ({ params }) => {
		const splat = params._splat?.replace(/^\/+|\/+$/g, "") ?? "";
		const slug = splat ? `platform-spec/${splat}` : "platform-spec";

		const [document, navTree, catalog] = await Promise.all([
			fetchDocumentBySlug({ data: { slug } }),
			fetchNavTree(),
			fetchCatalog(),
		]);

		if (!document) {
			throw notFound();
		}

		const frontmatter = document.frontmatter;
		const title =
			typeof frontmatter.title === "string" ? frontmatter.title : slug;
		const specLevel =
			typeof frontmatter.specLevel === "string" ? frontmatter.specLevel : null;
		const status =
			typeof frontmatter.status === "string" ? frontmatter.status : null;
		const description =
			typeof frontmatter.description === "string"
				? frontmatter.description
				: null;
		const architectureGraphMeta = (
			frontmatter as Record<string, unknown> | undefined
		)?.architectureGraph as
			| { graphKey?: unknown; entryNode?: unknown; layout?: unknown }
			| undefined;
		const architectureGraph =
			typeof architectureGraphMeta?.graphKey === "string"
				? {
						graphKey: architectureGraphMeta.graphKey,
						entryNode:
							typeof architectureGraphMeta.entryNode === "string"
								? architectureGraphMeta.entryNode
								: undefined,
					}
				: null;

		return {
			slug,
			navTree,
			catalog,
			title,
			specLevel,
			status,
			description,
			bodyMd: document.body,
			bookLinks: document.bookLinks,
			architectureGraph,
			layout: document.layout,
			layoutValidation: document.layoutValidation,
		};
	},
	component: PlatformSpecDocument,
});

function PlatformSpecDocument() {
	const {
		slug,
		navTree,
		catalog,
		title,
		specLevel,
		status,
		description,
		bodyMd,
		bookLinks,
		architectureGraph,
		layout,
		layoutValidation,
	} = Route.useLoaderData();

	const adrs = catalog.documents
		.filter((entry) => entry.kind === "decision" && entry.parentSlug === slug)
		.map((entry) => ({ href: entry.href, title: entry.title }));

	return (
		<ReaderChrome>
			<SpecShell navTree={navTree} activeSlug={slug}>
				<StructuredDocumentView
					title={title}
					specLevel={specLevel}
					status={status}
					description={description}
					bodyMd={bodyMd}
					bookLinks={bookLinks}
					architectureGraph={architectureGraph}
					adrs={adrs}
					layout={layout}
					layoutValidation={layoutValidation}
					catalogRevision={catalog.revision}
					standardId={
						catalog.documents.find((entry) => entry.slug === slug)?.key ??
						slug.replace(/^platform-spec\/capabilities\//, "")
					}
					proposeSearch={{
						capability: catalog.documents
							.find((entry) => entry.slug === slug)
							?.capability,
						domain: catalog.documents.find((entry) => entry.slug === slug)
							?.domain,
						area:
							catalog.documents.find((entry) => entry.slug === slug)?.area ??
							undefined,
						feature:
							catalog.documents.find((entry) => entry.slug === slug)
								?.feature ?? undefined,
					}}
				/>
			</SpecShell>
		</ReaderChrome>
	);
}

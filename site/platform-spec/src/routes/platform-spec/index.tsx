import { createFileRoute } from "@tanstack/react-router";

import { PlatformSpecHomeClient } from "#/components/reader/platform-spec-home-client";
import { ReaderChrome } from "#/components/reader/reader-chrome";
import { SpecShell } from "#/components/reader/spec-shell";
import { fetchCatalog, fetchNavTree } from "#/server/catalog";

export const Route = createFileRoute("/platform-spec/")({
	loader: async () => {
		const [catalog, navTree] = await Promise.all([
			fetchCatalog(),
			fetchNavTree(),
		]);
		return { catalog, navTree };
	},
	component: PlatformSpecHomePage,
});

function PlatformSpecHomePage() {
	const { catalog, navTree } = Route.useLoaderData();

	return (
		<ReaderChrome>
			<SpecShell navTree={navTree} activeSlug="platform-spec">
				<PlatformSpecHomeClient
					catalog={catalog.entries.map((entry) => ({
						slug: entry.slug,
						href: entry.href,
						title: entry.title,
						description: entry.description,
						status: entry.status,
						pathClass: entry.pathClass,
						domain: entry.domain,
					}))}
				/>
			</SpecShell>
		</ReaderChrome>
	);
}

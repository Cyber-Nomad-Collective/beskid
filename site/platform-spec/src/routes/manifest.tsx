import { createFileRoute } from "@tanstack/react-router";

import { ManifestView } from "#/components/reader/manifest-view";
import { ReaderChrome } from "#/components/reader/reader-chrome";
import { fetchCatalog, fetchNavTree } from "#/server/catalog";
import { fetchManifest } from "#/server/manifest";

export const Route = createFileRoute("/manifest")({
	loader: async () => {
		const [manifest, navTree, catalog] = await Promise.all([
			fetchManifest(),
			fetchNavTree(),
			fetchCatalog(),
		]);
		const knownCapabilities = new Set(
			catalog.entries.map((entry) => entry.capability),
		);
		return { manifest, navTree, knownCapabilities };
	},
	component: ManifestPage,
});

function ManifestPage() {
	const { manifest, navTree, knownCapabilities } = Route.useLoaderData();

	return (
		<ReaderChrome navTree={navTree} activeSlug="manifest">
			<ManifestView manifest={manifest} knownCapabilities={knownCapabilities} />
		</ReaderChrome>
	);
}

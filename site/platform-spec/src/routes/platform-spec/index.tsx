import { createFileRoute } from "@tanstack/react-router";

import { ReaderChrome } from "#/components/reader/reader-chrome";
import { SpecShell } from "#/components/reader/spec-shell";
import {
	PlatformSpecHome,
	SpecOriginProvider,
	type NavTreeNode as UiNavTreeNode,
} from "@beskid/ui-react/platform-spec";
import type { NavTreeNode } from "#/server/catalog";
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

function toUiNavTree(node: NavTreeNode): UiNavTreeNode {
	return {
		slug: node.slug,
		href: node.href,
		title: node.title,
		children: node.children?.map(toUiNavTree),
	};
}

function PlatformSpecHomePage() {
	const { catalog, navTree } = Route.useLoaderData();

	return (
		<ReaderChrome>
			<SpecOriginProvider>
				<SpecShell navTree={navTree} activeSlug="platform-spec">
					<div className="mx-auto w-full max-w-6xl px-6 py-6">
						<PlatformSpecHome
							catalog={catalog.entries.map((entry) => ({
								slug: entry.slug,
								href: entry.href,
								title: entry.title,
								description: entry.description,
								status: entry.status,
								pathClass: entry.pathClass,
							}))}
							navTree={[toUiNavTree(navTree)]}
						/>
					</div>
				</SpecShell>
			</SpecOriginProvider>
		</ReaderChrome>
	);
}

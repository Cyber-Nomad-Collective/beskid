import { createFileRoute, redirect } from "@tanstack/react-router";

import { ShellVersionsSync } from "#/components/shell-versions-sync";
import {
	resolveBoardLoaderFilters,
	VersionBoardView,
} from "#/components/version-board-view";
import { boardSearchSchema } from "#/lib/roadmap/board-search";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import { getAuthUser } from "#/server/auth";
import { getWorkstreamDashboard } from "#/server/catalog";
import { getBoard } from "#/server/roadmap";

export const Route = createFileRoute("/_shell/v/$version/w/$workstream")({
	validateSearch: boardSearchSchema,
	...roadmapScopeRouteOptions,
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}
		return { user };
	},
	loaderDeps: ({ search }) => search,
	loader: async ({ params, deps }) => {
		const scope = await getWorkstreamDashboard({
			data: { version: params.version, slug: params.workstream },
		});
		const board = await getBoard({
			data: resolveBoardLoaderFilters(params.version, deps, params.workstream),
		});
		return {
			board,
			workstreamTitle: scope.workstream.title,
		};
	},
	component: WorkstreamBoardPage,
});

function WorkstreamBoardPage() {
	const { version, workstream } = Route.useParams();
	const search = Route.useSearch();
	const { board, workstreamTitle } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ShellVersionsSync version={version} />
			<VersionBoardView
				version={version}
				board={board}
				search={search}
				fixedWorkstream={workstream}
				workstreamTitle={workstreamTitle}
				onNavigate={({ search: nextSearch, replace }) => {
					void navigate({
						search: nextSearch,
						replace,
					});
				}}
			/>
		</div>
	);
}

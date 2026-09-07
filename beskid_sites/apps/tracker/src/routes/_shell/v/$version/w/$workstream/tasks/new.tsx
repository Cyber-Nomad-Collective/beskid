import { createFileRoute, redirect } from "@tanstack/react-router";

import { CreateTaskWorkItem } from "#/components/create-task-work-item";
import { ShellVersionsSync } from "#/components/shell-versions-sync";
import { resolveBoardLoaderFilters } from "#/components/version-board-view";
import { boardSearchSchema } from "#/lib/roadmap/board-search";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import {
	boardSearchFromFilters,
	workstreamBoardRouteTo,
} from "#/lib/work-item-shell/paths";
import { getAuthUser } from "#/server/auth";
import { getWorkstreamDashboard } from "#/server/catalog";
import { getBoard } from "#/server/roadmap";

export const Route = createFileRoute(
	"/_shell/v/$version/w/$workstream/tasks/new",
)({
	validateSearch: boardSearchSchema.omit({ create: true }),
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
		await getWorkstreamDashboard({
			data: { version: params.version, slug: params.workstream },
		});
		const board = await getBoard({
			data: resolveBoardLoaderFilters(params.version, deps, params.workstream),
		});
		return {
			version: params.version,
			workstream: params.workstream,
			workstreamOptions: board.meta.workstreams,
			search: deps,
		};
	},
	component: WorkstreamCreateTaskPage,
});

function WorkstreamCreateTaskPage() {
	const { version, workstream } = Route.useParams();
	const { workstreamOptions, search } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const boardSearch = boardSearchFromFilters(search);
	const collapseTo = workstreamBoardRouteTo(version, workstream, {
		...boardSearch,
		create: "1",
	});

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ShellVersionsSync version={version} />
			<CreateTaskWorkItem
				presentation="page"
				version={version}
				workstreamOptions={workstreamOptions}
				defaultWorkstream={workstream}
				collapseTo={collapseTo}
				onCreated={() => {
					void navigate(workstreamBoardRouteTo(version, workstream, boardSearch));
				}}
				onClose={() => {
					void navigate(workstreamBoardRouteTo(version, workstream, boardSearch));
				}}
			/>
		</div>
	);
}

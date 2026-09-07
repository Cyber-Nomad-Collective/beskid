import { createFileRoute, redirect } from "@tanstack/react-router";

import { CreateTaskWorkItem } from "#/components/create-task-work-item";
import { ShellVersionsSync } from "#/components/shell-versions-sync";
import { boardSearchSchema } from "#/lib/roadmap/board-search";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import {
	boardRouteTo,
	boardSearchFromFilters,
} from "#/lib/work-item-shell/paths";
import { getAuthUser } from "#/server/auth";
import { getBoard } from "#/server/roadmap";

export const Route = createFileRoute("/_shell/v/$version/tasks/new")({
	validateSearch: boardSearchSchema.omit({ create: true }),
	loaderDeps: ({ search }) => search,
	...roadmapScopeRouteOptions,
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}
		return { user };
	},
	loader: async ({ params, deps }) => {
		const board = await getBoard({
			data: {
				version: params.version,
				workstream: deps.workstream,
				domain: deps.domain,
				area: deps.area,
				feature: deps.feature,
			},
		});
		return {
			version: params.version,
			workstreamOptions: board.meta.workstreams,
			search: deps,
		};
	},
	component: CreateTaskPage,
});

function CreateTaskPage() {
	const { version, workstreamOptions, search } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const boardSearch = boardSearchFromFilters(search);
	const collapseTo = boardRouteTo(version, { ...boardSearch, create: "1" });

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ShellVersionsSync version={version} />
			<CreateTaskWorkItem
				presentation="page"
				version={version}
				workstreamOptions={workstreamOptions}
				collapseTo={collapseTo}
				onCreated={() => {
					void navigate(boardRouteTo(version, boardSearch));
				}}
				onClose={() => {
					void navigate(boardRouteTo(version, boardSearch));
				}}
			/>
		</div>
	);
}

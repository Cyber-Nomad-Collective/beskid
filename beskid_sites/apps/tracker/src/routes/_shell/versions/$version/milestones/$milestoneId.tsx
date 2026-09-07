import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_shell/versions/$version/milestones/$milestoneId",
)({
	loader: ({ params }) => {
		throw redirect({
			to: "/versions/$version/deliverables/$deliverableId",
			params: {
				version: params.version,
				deliverableId: params.milestoneId,
			},
		});
	},
});

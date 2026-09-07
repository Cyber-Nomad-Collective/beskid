import { createFileRoute, redirect } from "@tanstack/react-router";

import { PLATFORM_SPEC_ORIGIN } from "#/lib/beskid-docs-origin";

export const Route = createFileRoute("/_shell/docs/")({
	beforeLoad: () => {
		throw redirect({
			href: `${PLATFORM_SPEC_ORIGIN}/platform-spec/`,
		});
	},
});

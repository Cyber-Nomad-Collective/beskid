import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { requireMaintainer } from "#/server/auth-guard.server";
import { syncFromGitClone } from "#/server/memgraph/import-json";

const runGitSync = createServerFn({ method: "POST" }).handler(async () => {
	await requireMaintainer();
	return syncFromGitClone();
});

export const Route = createFileRoute("/api/v1/admin/sync")({
	server: {
		handlers: {
			POST: async () => {
				try {
					const result = await runGitSync();
					return Response.json(result);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					return Response.json({ error: message }, { status: 500 });
				}
			},
		},
	},
});

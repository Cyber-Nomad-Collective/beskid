import { createFileRoute } from "@tanstack/react-router";

import {
	fetchNormativeRepoSettingsFn,
	updateNormativeRepoSettingsFn,
} from "#/server/normative-repo-settings";

export const Route = createFileRoute("/api/v1/admin/normative-repo")({
	server: {
		handlers: {
			GET: async () => {
				try {
					return Response.json(await fetchNormativeRepoSettingsFn());
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					return Response.json({ error: message }, { status: 403 });
				}
			},
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as { repoUrl?: string };
					if (!body.repoUrl?.trim()) {
						return Response.json({ error: "repoUrl is required" }, { status: 400 });
					}
					const config = await updateNormativeRepoSettingsFn({
						data: { repoUrl: body.repoUrl.trim() },
					});
					return Response.json(config);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					const status = message.includes("maintainers") ? 403 : 500;
					return Response.json({ error: message }, { status });
				}
			},
		},
	},
});

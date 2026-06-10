import { createFileRoute } from "@tanstack/react-router";

import { handleGithubWebhook } from "#/server/git-sync/webhook";

export const Route = createFileRoute("/api/webhooks/github")({
	server: {
		handlers: {
			POST: async ({ request }) => handleGithubWebhook(request),
		},
	},
});

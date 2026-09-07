import { createFileRoute } from "@tanstack/react-router";

import { handleGithubWebhook } from "#/server/git-sync/webhook";

// Merged pull requests are the only event that can make a new OpenSpec catalog
// revision observable to Platform Spec readers.
const handleMergedOpenSpecWebhook = handleGithubWebhook;

export const Route = createFileRoute("/api/webhooks/github")({
	server: {
		handlers: {
			POST: async ({ request }) => handleMergedOpenSpecWebhook(request),
		},
	},
});

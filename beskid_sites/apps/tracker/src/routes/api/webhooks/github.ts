import { createFileRoute } from "@tanstack/react-router";

import {
	getGithubWebhookSecret,
	handleGithubIssuesWebhook,
	verifyGithubWebhookSignature,
} from "#/lib/sync/github-webhook";

export const Route = createFileRoute("/api/webhooks/github")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const secret = getGithubWebhookSecret();
				if (!secret) {
					return new Response("GitHub webhook is not configured", {
						status: 503,
					});
				}

				const rawBody = await request.text();
				const signature = request.headers.get("x-hub-signature-256");

				if (!verifyGithubWebhookSignature(rawBody, signature, secret)) {
					return new Response("Invalid signature", { status: 401 });
				}

				const event = request.headers.get("x-github-event") ?? "";
				let payload: unknown;

				try {
					payload = JSON.parse(rawBody) as unknown;
				} catch {
					return new Response("Invalid JSON body", { status: 400 });
				}

				if (event === "ping") {
					return Response.json({ ok: true });
				}

				if (event === "issues" && payload && typeof payload === "object") {
					handleGithubIssuesWebhook(
						payload as Parameters<typeof handleGithubIssuesWebhook>[0],
					);
				}

				return Response.json({ ok: true });
			},
		},
	},
});

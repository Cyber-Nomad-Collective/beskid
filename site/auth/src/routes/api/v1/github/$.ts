import { createFileRoute } from "@tanstack/react-router";

import { proxyGitHubApi } from "#/server/github-proxy";

export const Route = createFileRoute("/api/v1/github/$")({
	server: {
		handlers: {
			GET: ({ request, params }) =>
				proxyGitHubApi(request, params._splat ?? ""),
			POST: ({ request, params }) =>
				proxyGitHubApi(request, params._splat ?? ""),
			PATCH: ({ request, params }) =>
				proxyGitHubApi(request, params._splat ?? ""),
			PUT: ({ request, params }) =>
				proxyGitHubApi(request, params._splat ?? ""),
			DELETE: ({ request, params }) =>
				proxyGitHubApi(request, params._splat ?? ""),
		},
	},
});

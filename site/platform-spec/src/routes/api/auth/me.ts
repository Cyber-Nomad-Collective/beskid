import { createFileRoute } from "@tanstack/react-router";

import { getSessionFromRequest } from "#/lib/session/cookie";

export const Route = createFileRoute("/api/auth/me")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await getSessionFromRequest(request);
				if (!session) {
					return Response.json({ user: null }, { status: 401 });
				}
				return Response.json({
					user: {
						login: session.login,
						name: session.name,
						avatarUrl: session.avatarUrl,
					},
				});
			},
		},
	},
});

import { createFileRoute } from "@tanstack/react-router";

import { isAdminLogin } from "#/server/config-store";
import { getSessionFromRequest } from "#/server/session";

export const Route = createFileRoute("/api/v1/me")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await getSessionFromRequest(request);
				if (!session) {
					return Response.json({ error: "Not authenticated" }, { status: 401 });
				}
				const isAdmin = await isAdminLogin(session.login);
				return Response.json({
					user: {
						login: session.login,
						name: session.name,
						avatarUrl: session.avatarUrl,
					},
					isAdmin,
				});
			},
		},
	},
});

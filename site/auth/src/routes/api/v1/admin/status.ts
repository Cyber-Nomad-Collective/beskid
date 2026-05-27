import { createFileRoute } from "@tanstack/react-router";

import { env } from "#/env";
import {
	isOAuthConfigured,
	isOnboarded,
	listEnabledApps,
	readAuthConfig,
	resolveOAuthConfig,
} from "#/server/config-store";

export const Route = createFileRoute("/api/v1/admin/status")({
	server: {
		handlers: {
			GET: async () => {
				const [oauth, apps, onboarded] = await Promise.all([
					resolveOAuthConfig(),
					listEnabledApps(),
					isOnboarded(),
				]);
				return Response.json({
					onboarded,
					oauthConfigured: await isOAuthConfigured(),
					oauthSource: oauth.source,
					hasSessionSecret: env.SESSION_SECRET.length >= 32,
					hasSetupToken: Boolean(env.AUTH_SETUP_TOKEN?.trim()),
					appCount: apps.length,
				});
			},
		},
	},
});

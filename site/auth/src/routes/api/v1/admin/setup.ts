import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { env } from "#/env";
import {
	isOnboarded,
	verifySetupToken,
	writeAuthConfig,
} from "#/server/config-store";

const setupSchema = z.object({
	setupToken: z.string().optional(),
	githubClientId: z.string().min(1),
	githubClientSecret: z.string().min(1),
	githubOAuthCallbackUrl: z.string().url(),
	adminGitHubLogins: z.array(z.string().min(1)).min(1),
	apps: z
		.array(
			z.object({
				id: z.enum(["tracker", "nexus", "pckg"]),
				publicUrl: z.string().url(),
				enabled: z.boolean().optional(),
			}),
		)
		.optional()
		.default([]),
});

export const Route = createFileRoute("/api/v1/admin/setup")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const onboarded = await isOnboarded();
				let json: unknown;
				try {
					json = await request.json();
				} catch {
					return Response.json({ error: "Invalid JSON" }, { status: 400 });
				}

				const setupToken =
					(typeof json === "object" &&
					json &&
					"setupToken" in json &&
					typeof json.setupToken === "string"
						? json.setupToken
						: undefined) ??
					request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
					undefined;

				const setupTokenRequired =
					onboarded || Boolean(env.AUTH_SETUP_TOKEN?.trim());
				if (setupTokenRequired && !verifySetupToken(setupToken)) {
					return Response.json({ error: "Invalid setup token" }, { status: 403 });
				}

				const parsed = setupSchema.safeParse(json);
				if (!parsed.success) {
					return Response.json({ error: "Invalid setup payload" }, { status: 400 });
				}

				await writeAuthConfig({
					onboarded: true,
					githubClientId: parsed.data.githubClientId,
					githubClientSecret: parsed.data.githubClientSecret,
					githubOAuthCallbackUrl: parsed.data.githubOAuthCallbackUrl,
					adminGitHubLogins: parsed.data.adminGitHubLogins.map((s) =>
						s.trim().toLowerCase(),
					),
					apps: [],
				});

				return Response.json({ ok: true as const });
			},
		},
	},
});

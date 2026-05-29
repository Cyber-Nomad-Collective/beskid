import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { requireHubAdmin } from "#/server/hub-admin";
import {
	addAdminLogin,
	getAdminLogins,
	removeAdminLogin,
} from "#/server/hub-admin-bootstrap.server";

const githubLoginSchema = z
	.string()
	.min(1)
	.max(39)
	.regex(
		/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
		"Invalid GitHub login",
	);

const addBodySchema = z.object({
	login: githubLoginSchema,
});

const removeQuerySchema = z.object({
	login: githubLoginSchema,
});

export const Route = createFileRoute("/api/v1/admin/admins")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const admin = await requireHubAdmin(request);
				if (!admin) {
					return Response.json({ error: "Hub admin required" }, { status: 401 });
				}

				return Response.json({ admins: getAdminLogins() });
			},
			POST: async ({ request }) => {
				const admin = await requireHubAdmin(request);
				if (!admin) {
					return Response.json({ error: "Hub admin required" }, { status: 401 });
				}

				let json: unknown;
				try {
					json = await request.json();
				} catch {
					return Response.json({ error: "Invalid JSON" }, { status: 400 });
				}

				const parsed = addBodySchema.safeParse(json);
				if (!parsed.success) {
					return Response.json({ error: "Invalid payload" }, { status: 400 });
				}

				const admins = addAdminLogin(parsed.data.login);
				return Response.json({ admins });
			},
			DELETE: async ({ request }) => {
				const admin = await requireHubAdmin(request);
				if (!admin) {
					return Response.json({ error: "Hub admin required" }, { status: 401 });
				}

				const url = new URL(request.url);
				const parsed = removeQuerySchema.safeParse({
					login: url.searchParams.get("login") ?? "",
				});
				if (!parsed.success) {
					return Response.json({ error: "Invalid login" }, { status: 400 });
				}

				const target = parsed.data.login.trim().toLowerCase();
				const current = getAdminLogins();
				if (current.length <= 1 && current.includes(target)) {
					return Response.json(
						{ error: "Cannot remove the last hub admin" },
						{ status: 400 },
					);
				}

				const admins = removeAdminLogin(target);
				return Response.json({ admins });
			},
		},
	},
});

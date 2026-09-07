import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createPackageSubforum, NodebbError } from "#/server/nodebb";

const bodySchema = z.object({
	packageName: z.string().min(1),
});

/**
 * Server endpoint to create a locked NodeBB subforum for a package.
 *
 * Called when a package is published (or on demand from the dashboard). The
 * NodeBB admin token is server-only — never exposed to the client. Returns
 * the created category id, slug, and public community URL so the caller
 * (the pckg .NET backend) can store the `{ slug → cid }` mapping.
 */
export const Route = createFileRoute("/api/nodebb/create-subforum")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				let parsed: z.infer<typeof bodySchema>;
				try {
					const json = (await request.json()) as unknown;
					parsed = bodySchema.parse(json);
				} catch {
					return Response.json(
						{ ok: false as const, error: "invalid_body" },
						{ status: 400 },
					);
				}
				try {
					const result = await createPackageSubforum({
						packageName: parsed.packageName,
					});
					return Response.json({ ok: true as const, ...result });
				} catch (error) {
					if (error instanceof NodebbError) {
						return Response.json(
							{ ok: false as const, error: error.message },
							{ status: error.status },
						);
					}
					return Response.json(
						{ ok: false as const, error: "internal_error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

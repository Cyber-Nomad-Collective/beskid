import { createFileRoute } from "@tanstack/react-router";

import { getOpenSpecDocument } from "#/server/openspec/reader";

export const Route = createFileRoute("/api/v1/docs/$")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const slug = params._splat?.replace(/^\/+|\/+$/g, "") ?? "";
				if (!slug) {
					return Response.json({ error: "missing slug" }, { status: 400 });
				}

				const document = getOpenSpecDocument(slug);
				if (!document) {
					return Response.json({ error: "not found" }, { status: 404 });
				}

				return Response.json(document);
			},
			PATCH: async () => {
				return Response.json(
					{
						error:
							"canonical OpenSpec documents are changed through openspec/changes",
					},
					{ status: 405, headers: { Allow: "GET" } },
				);
			},
		},
	},
});

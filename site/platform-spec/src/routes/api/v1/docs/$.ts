import { createFileRoute } from "@tanstack/react-router";

import {
	getLocalNode,
	localWorkspaceRoot,
	saveLocalNodeComments,
	saveLocalNodeContent,
	saveLocalNodeLayout,
} from "#/server/local-workspace/index";
import { getDocumentBySlug } from "#/server/memgraph/documents";

export const Route = createFileRoute("/api/v1/docs/$")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const slug = params._splat?.replace(/^\/+|\/+$/g, "") ?? "";
				if (!slug) {
					return Response.json({ error: "missing slug" }, { status: 400 });
				}

				if (localWorkspaceRoot()) {
					const local = getLocalNode(slug);
					if (!local) {
						return Response.json({ error: "not found" }, { status: 404 });
					}
					return Response.json({
						slug: local.slug,
						title: local.node.title,
						specLevel: local.node.specLevel,
						status: local.node.status ?? null,
						description: local.node.description ?? null,
						body: local.bodyMd,
						layoutJson: local.layoutJson,
						commentsJson: local.commentsJson,
						frontmatter: local.node,
					});
				}

				const document = await getDocumentBySlug(slug);
				if (!document) {
					return Response.json({ error: "not found" }, { status: 404 });
				}

				return Response.json(document);
			},
			PATCH: async ({ params, request }) => {
				if (!localWorkspaceRoot()) {
					return Response.json(
						{ error: "local workspace not configured" },
						{ status: 400 },
					);
				}

				const slug = params._splat?.replace(/^\/+|\/+$/g, "") ?? "";
				if (!slug) {
					return Response.json({ error: "missing slug" }, { status: 400 });
				}

				const payload = (await request.json()) as {
					bodyMd?: string;
					layoutJson?: Record<string, unknown>;
					commentsJson?: Record<string, unknown>;
				};

				if (payload.bodyMd != null) {
					saveLocalNodeContent(slug, payload.bodyMd);
				}
				if (payload.layoutJson != null) {
					saveLocalNodeLayout(slug, payload.layoutJson);
				}
				if (payload.commentsJson != null) {
					saveLocalNodeComments(slug, payload.commentsJson);
				}

				return Response.json({ ok: true });
			},
		},
	},
});

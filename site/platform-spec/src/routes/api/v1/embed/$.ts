import { createFileRoute } from "@tanstack/react-router";

import { renderMarkdownToHtml } from "#/lib/markdown";
import {
	getOpenSpecEmbed,
	loadOpenSpecCatalog,
} from "#/server/openspec/reader";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Accept",
	"Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
};

export const Route = createFileRoute("/api/v1/embed/$")({
	server: {
		handlers: {
			OPTIONS: async () =>
				new Response(null, { status: 204, headers: corsHeaders }),
			GET: async ({ params, request }) => {
				const identifier = params._splat?.replace(/^\/+|\/+$/g, "") ?? "";
				if (!identifier) {
					return Response.json(
						{ error: "missing embed reference" },
						{ status: 400, headers: corsHeaders },
					);
				}
				const embed = getOpenSpecEmbed(identifier);
				if (!embed) {
					return Response.json(
						{ error: "unknown OpenSpec reference" },
						{ status: 404, headers: corsHeaders },
					);
				}
				const url = new URL(request.url);
				const catalog = loadOpenSpecCatalog();
				const payload = {
					kind: "spec" as const,
					ref: identifier,
					revision: catalog.revision,
					capability: embed.entry.capability,
					title: embed.requirement?.title ?? embed.entry.title,
					href: embed.entry.href,
					markdown: embed.markdown,
					html: renderMarkdownToHtml(embed.markdown),
				};
				if (url.searchParams.get("format") === "html") {
					return new Response(payload.html, {
						headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
					});
				}
				return Response.json(payload, { headers: corsHeaders });
			},
		},
	},
});

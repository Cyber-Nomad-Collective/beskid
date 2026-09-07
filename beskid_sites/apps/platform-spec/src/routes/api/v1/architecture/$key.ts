import fs from "node:fs";
import path from "node:path";
import { createFileRoute } from "@tanstack/react-router";

import { platformSpecDataDir } from "#/lib/storage/paths";

function isArchitectureGraph(value: unknown): value is Record<string, unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		Array.isArray((value as Record<string, unknown>).nodes) &&
		Array.isArray((value as Record<string, unknown>).edges)
	);
}

export const Route = createFileRoute("/api/v1/architecture/$key")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const key = params.key?.replace(/^\/+|\/+$/g, "") ?? "";
				if (!/^[a-z0-9][a-z0-9-]*$/i.test(key)) {
					return Response.json({ error: "invalid key" }, { status: 400 });
				}

				const filePath = path.join(
					platformSpecDataDir(),
					"derived",
					"architecture",
					`${key}.json`,
				);

				if (!fs.existsSync(filePath)) {
					return Response.json({ error: "not found", key }, { status: 404 });
				}

				const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
				if (!isArchitectureGraph(raw)) {
					return Response.json(
						{
							error: "invalid architecture graph",
							key,
						},
						{ status: 400 },
					);
				}

				return Response.json(raw);
			},
		},
	},
});

import { createFileRoute } from "@tanstack/react-router";

import fs from "node:fs";
import path from "node:path";

import { validateArchitectureGraph } from "@cyber-nomad-collective/spec-core";
import { SPEC_ARCHITECTURE_DIR } from "@cyber-nomad-collective/spec-core";
import { localWorkspaceRoot } from "#/server/local-workspace/index";
import { env } from "#/env.server";
import { platformSpecDataDir } from "#/lib/storage/paths";

export const Route = createFileRoute("/api/v1/architecture/$key")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const key = params.key?.replace(/^\/+|\/+$/g, "") ?? "";
				if (!key) return Response.json({ error: "missing key" }, { status: 400 });

				const workspaceRoot =
					localWorkspaceRoot() ??
					(env.SPEC_GIT_CLONE_DIR?.trim() ??
						path.join(platformSpecDataDir(), "git-clone"));

				const filePath = path.join(
					workspaceRoot,
					SPEC_ARCHITECTURE_DIR,
					`${key}.json`,
				);

				if (!fs.existsSync(filePath)) {
					return Response.json(
						{ error: "not found", key },
						{ status: 404 },
					);
				}

				const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
				const result = validateArchitectureGraph(raw, { context: filePath });
				if (!result.ok || !result.graph) {
					return Response.json(
						{
							error: "invalid architecture graph",
							key,
							issues: result.issues,
						},
						{ status: 400 },
					);
				}

				return Response.json(result.graph);
			},
		},
	},
});


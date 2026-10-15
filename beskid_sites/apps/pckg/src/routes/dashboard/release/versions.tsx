import { createFileRoute } from "@tanstack/react-router";
import { ReleasesCenter } from "#/components/release/releases-center";

/** Release center > Releases: every published version with yank / unyank. */
export const Route = createFileRoute("/dashboard/release/versions")({
	component: ReleasesCenter,
});

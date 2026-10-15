import { createFileRoute } from "@tanstack/react-router";
import { ReleaseOverview } from "#/components/release/release-overview";

/** Release center landing: publish recipe, recent releases, quick links. */
export const Route = createFileRoute("/dashboard/release/")({
	component: ReleaseOverview,
});

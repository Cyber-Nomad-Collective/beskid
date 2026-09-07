import { createFileRoute } from "@tanstack/react-router";
import { Downloads } from "#/components/downloads";

function DownloadsPage() {
	return <Downloads />;
}

export const Route = createFileRoute("/downloads")({
	component: DownloadsPage,
});

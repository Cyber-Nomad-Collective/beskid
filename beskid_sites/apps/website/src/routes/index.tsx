import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "#/components/landing";

function IndexPage() {
	return <Landing />;
}

export const Route = createFileRoute("/")({
	component: IndexPage,
});

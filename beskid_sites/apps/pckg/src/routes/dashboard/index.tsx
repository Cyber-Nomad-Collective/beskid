import { createFileRoute, redirect } from "@tanstack/react-router";

/** Dashboard home — redirect to the my-packages view. */
export const Route = createFileRoute("/dashboard/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/my-packages" });
	},
});

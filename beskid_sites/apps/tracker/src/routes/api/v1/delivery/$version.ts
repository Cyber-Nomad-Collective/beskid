import { createFileRoute } from "@tanstack/react-router";

import { getIssuesDatabase } from "#/lib/storage/db";
import { deliveryByVersion } from "./latest";

export const Route = createFileRoute("/api/v1/delivery/$version")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const delivery = await deliveryByVersion(
					getIssuesDatabase(),
					params.version,
				);
				return delivery
					? Response.json(delivery, {
							headers: { "Cache-Control": "public, max-age=300" },
						})
					: Response.json({ error: "Unknown public release" }, { status: 404 });
			},
		},
	},
});

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: () =>
				Response.json({ ok: true, service: "beskid-website" }, { status: 200 }),
		},
	},
});

import { createFileRoute } from "@tanstack/react-router";

import { initObservability, metricsHandler } from "#/server/observability";

initObservability({ service: "beskid-tracker" });

export const Route = createFileRoute("/metrics")({
	server: {
		handlers: {
			GET: () => metricsHandler(),
		},
	},
});

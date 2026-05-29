import { createFileRoute } from "@tanstack/react-router";

import { initObservability, metricsHandler } from "@beskid/server-observability";

initObservability({ service: "beskid-auth" });

export const Route = createFileRoute("/metrics")({
	server: {
		handlers: {
			GET: () => metricsHandler(),
		},
	},
});

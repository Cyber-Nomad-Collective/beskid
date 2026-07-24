import {
	getObservability,
	initObservability,
} from "@beskid/server-observability";
import { createMiddleware } from "@tanstack/react-start";

initObservability({ service: "beskid-platform-spec" });

export const observabilityMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const url = new URL(request.url);
		if (url.pathname === "/metrics") {
			return next();
		}

		const start = performance.now();
		try {
			const result = await next();
			getObservability().recordHttpRequest(
				request.method,
				url.pathname,
				200,
				(performance.now() - start) / 1000,
			);
			return result;
		} catch (error) {
			getObservability().recordHttpRequest(
				request.method,
				url.pathname,
				500,
				(performance.now() - start) / 1000,
			);
			throw error;
		}
	},
);

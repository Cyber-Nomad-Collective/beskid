import { describe, expect, it } from "vitest";
import { Route } from "./health";

type HealthRoute = {
	server: {
		handlers: {
			GET: (ctx: { request: Request }) => Promise<Response>;
		};
	};
};

describe("GET /api/health", () => {
	it("returns 200 with ok=true and the service name", async () => {
		const route = Route as unknown as HealthRoute;
		const handler = route.server?.handlers?.GET;
		expect(typeof handler).toBe("function");
		const response = await handler({
			request: new Request("http://localhost/api/health"),
		});
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ ok: true, service: "beskid-pckg" });
	});
});

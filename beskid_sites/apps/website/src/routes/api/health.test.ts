import { describe, expect, it } from "vitest";
import { Route } from "#/routes/api/health";

describe("GET /api/health", () => {
	it("returns 200 with ok=true and the service name", async () => {
		const handler = (
			Route as unknown as {
				server: { handlers: { GET: () => Response } };
			}
		).server.handlers.GET;
		const res = handler();
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ ok: true, service: "beskid-website" });
	});
});

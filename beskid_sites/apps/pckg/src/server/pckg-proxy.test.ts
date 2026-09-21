import { describe, expect, it } from "vitest";
import { buildPckgProxyRequest } from "./pckg-proxy";

describe("pckg proxy request", () => {
	it("preserves method, query, body, and trusted identity headers", async () => {
		const request = new Request("https://pckg.example/api/packages?q=one", {
			method: "POST",
			headers: { "content-type": "application/json", "remote-user": "verified" },
			body: JSON.stringify({ ok: true }),
		});
		const proxied = await buildPckgProxyRequest(request, "http://registry:8083");
		expect(proxied.url).toBe("http://registry:8083/api/packages?q=one");
		expect(proxied.method).toBe("POST");
		expect(proxied.headers.get("remote-user")).toBe("verified");
		expect(await proxied.text()).toBe(JSON.stringify({ ok: true }));
	});
});

import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../pages/api/version.json.ts";

test("falls back from missing stable metadata to the published unstable release state", async (t) => {
	const originalFetch = globalThis.fetch;
	t.after(() => {
		globalThis.fetch = originalFetch;
	});

	const requested: string[] = [];
	globalThis.fetch = async (input) => {
		const url = String(input);
		requested.push(url);
		if (url.includes("cli-stable")) return new Response("not found", { status: 404 });
		if (url.endsWith("/release-state.json")) {
			return new Response(
				JSON.stringify({
					channel: "unstable",
					version: "0.4.607-unstable",
					available_artifacts: [
						"beskid-linux-amd64",
						"beskid-darwin-arm64",
						"beskid-windows-amd64.exe",
					],
				}),
				{ status: 200 },
			);
		}
		return new Response("not found", { status: 404 });
	};

	const response = await GET({ url: new URL("https://beskid-lang.org/api/version.json") });
	const payload = await response.json();

	assert.equal(payload.version, "0.4.607-unstable");
	assert.equal(payload.source, "github:unstable");
	assert.equal(payload.assets.length, 3);
	assert.ok(requested.some((url) => url.includes("cli-stable/release-state.json")));
	assert.ok(requested.some((url) => url.includes("cli-unstable/release-state.json")));
});

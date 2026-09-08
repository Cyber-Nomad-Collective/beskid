import assert from "node:assert/strict";
import test from "node:test";

import { fetchWithRetry } from "./sync-release-version.mjs";

test("retries a transient GitHub gateway failure", async () => {
	let calls = 0;
	const response = await fetchWithRetry(
		"https://api.github.example/releases",
		{},
		{
			fetchImpl: async () => {
				calls += 1;
				return new Response("", { status: calls === 1 ? 504 : 200 });
			},
			sleep: async () => {},
		},
	);

	assert.equal(response.status, 200);
	assert.equal(calls, 2);
});

test("does not retry a non-transient response", async () => {
	let calls = 0;
	const response = await fetchWithRetry(
		"https://api.github.example/releases",
		{},
		{
			fetchImpl: async () => {
				calls += 1;
				return new Response("", { status: 404 });
			},
			sleep: async () => {},
		},
	);

	assert.equal(response.status, 404);
	assert.equal(calls, 1);
});

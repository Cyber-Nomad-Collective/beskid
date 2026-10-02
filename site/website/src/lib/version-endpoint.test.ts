import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../pages/api/version.json.ts";

test("qualified native release metadata does not invent container publication", async (t) => {
	const originalFetch = globalThis.fetch;
	t.after(() => { globalThis.fetch = originalFetch; });
	globalThis.fetch = async () => new Response(JSON.stringify({
		channel: "stable",
		version: "0.5.1",
		available_artifacts: ["beskid-linux-amd64", "beskid-0.5.1-amd64.deb"],
		distribution: {
			// Unknown, unqualified extras cannot establish an OCI publication lane.
			container_images: { base: "ghcr.io/example/unverified:0.5.1" },
		},
	}), { status: 200 });
	const response = await GET({ url: new URL("https://beskid-lang.org/api/version.json") });
	const payload = await response.json();
	assert.equal(response.status, 200);
	assert.equal(payload.version, "0.5.1");
	assert.equal(payload.source, "github:stable");
	assert.equal(Object.hasOwn(payload, "containerImages"), false);
	assert.deepEqual(payload.assets, [{
		platform: "linux-amd64", kind: "binary",
		url: "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-stable/beskid-linux-amd64",
		filename: "beskid-linux-amd64",
	}]);
	assert.deepEqual(payload.packages, [{
		platform: "linux-amd64", label: "Ubuntu / Debian (.deb)",
		command: "sudo apt install ./beskid-0.5.1-amd64.deb",
		url: "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-stable/beskid-0.5.1-amd64.deb",
	}]);
	assert.equal(payload.installScript.sh, "curl -fsSL https://beskid-lang.org/install.sh | BESKID_RELEASE_TAG=cli-stable bash");
});

test("missing published metadata fails closed without download or OCI claims", async (t) => {
	const originalFetch = globalThis.fetch;
	t.after(() => { globalThis.fetch = originalFetch; });
	globalThis.fetch = async () => new Response("not found", { status: 404 });
	const response = await GET({ url: new URL("https://beskid-lang.org/api/version.json") });
	assert.equal(response.status, 502);
	assert.deepEqual(await response.json(), { error: "No published compiler release state is available" });
});

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
							"beskid-0.4.607-unstable-amd64.deb",
							"beskid-0.4.607-unstable-windows-amd64.msi",
							"beskid-0.4.607-unstable-windows-amd64.exe",
							"beskid-0.4.607-unstable-macos-arm64.dmg",
						],
						distribution: {
							homebrew_formula: { name: "beskid.rb" },
						},
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
	assert.deepEqual(
		payload.assets.map((asset: { platform: string; filename: string }) => ({
			platform: asset.platform,
			filename: asset.filename,
		})),
		[
			{ platform: "linux-amd64", filename: "beskid-linux-amd64" },
			{ platform: "darwin-arm64", filename: "beskid-darwin-arm64" },
			{ platform: "windows-amd64", filename: "beskid-windows-amd64.exe" },
		],
	);
	assert.deepEqual(
		payload.packages.map((pkg: { platform: string; label: string }) => ({
			platform: pkg.platform,
			label: pkg.label,
		})),
		[
			{ platform: "linux-amd64", label: "Ubuntu / Debian (.deb)" },
			{ platform: "windows-amd64", label: "Windows (.msi)" },
			{ platform: "windows-amd64", label: "Windows (.exe bootstrapper)" },
			{ platform: "darwin-arm64", label: "macOS (.dmg)" },
			{ platform: "darwin-arm64", label: "Homebrew" },
		],
	);
	assert.ok(requested.some((url) => url.includes("cli-stable/release-state.json")));
	assert.ok(requested.some((url) => url.includes("cli-unstable/release-state.json")));
});

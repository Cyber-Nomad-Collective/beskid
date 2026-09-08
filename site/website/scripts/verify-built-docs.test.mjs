import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { verifyBuiltDocs } from "./verify-built-docs.mjs";

async function writeRoute(distDir, route, html) {
	const relative = route === "/" ? "index.html" : route.replace(/^\//, "") + "index.html";
	const filePath = path.join(distDir, relative);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, html);
}

async function createDist(t) {
	const distDir = await mkdtemp(path.join(tmpdir(), "beskid-built-docs-"));
	t.after(() => rm(distDir, { recursive: true, force: true }));
	await writeRoute(distDir, "/", "<h1>Home</h1>");
	await writeFile(path.join(distDir, "404.html"), "<h1>404</h1>");
	await writeRoute(distDir, "/book/reference/lsp/", "<h1>LSP</h1>");
	await writeRoute(distDir, "/book/reference/projects/", "<h1>Projects</h1>");
	return distDir;
}

function redirectHtml(destination) {
	return `<!doctype html><meta http-equiv="refresh" content="0;url=${destination}">`;
}

test("resolves redirect chains before validating a linked anchor", async (t) => {
	const distDir = await createDist(t);
	await writeRoute(distDir, "/docs/", '<main><h1>Docs</h1><a href="/legacy/#install">Install</a></main>');
	await writeRoute(distDir, "/legacy/", redirectHtml("/intermediate/"));
	await writeRoute(distDir, "/intermediate/", redirectHtml("/target/"));
	await writeRoute(distDir, "/target/", '<main><h1>Target</h1><h2 id="install">Install</h2></main>');

	assert.deepEqual(verifyBuiltDocs(distDir), []);
});

test("reports a redirect whose final destination is missing", async (t) => {
	const distDir = await createDist(t);
	await writeRoute(distDir, "/docs/", "<main><h1>Docs</h1></main>");
	await writeRoute(distDir, "/legacy/", redirectHtml("/missing/"));

	assert.ok(
		verifyBuiltDocs(distDir).some((error) => error.includes("redirect destination does not resolve: /missing/")),
	);
});

test("reports redirect cycles", async (t) => {
	const distDir = await createDist(t);
	await writeRoute(distDir, "/docs/", "<main><h1>Docs</h1></main>");
	await writeRoute(distDir, "/legacy/", redirectHtml("/intermediate/"));
	await writeRoute(distDir, "/intermediate/", redirectHtml("/legacy/"));

	assert.ok(
		verifyBuiltDocs(distDir).some((error) => error.includes("redirect cycle")),
	);
});

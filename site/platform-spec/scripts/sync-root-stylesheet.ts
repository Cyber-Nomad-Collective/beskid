#!/usr/bin/env bun
/**
 * Align SSR router stylesheet href with the Nitro public asset map (index.mjs).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const server = path.join(root, ".output/server");
const publicDir = path.join(root, ".output/public/assets");

function main(): void {
	const indexMjs = path.join(server, "index.mjs");
	if (!fs.existsSync(indexMjs)) {
		console.error(`sync-root-stylesheet: missing ${indexMjs}`);
		process.exit(1);
	}

	const indexSource = fs.readFileSync(indexMjs, "utf8");
	const match = indexSource.match(/"\/assets\/(styles-[^"]+\.css)"/);
	if (!match) {
		console.error("sync-root-stylesheet: no stylesheet entry in index.mjs");
		process.exit(1);
	}

	const canonical = `/assets/${match[1]}`;
	const cssFile = path.join(publicDir, match[1]!);
	if (!fs.existsSync(cssFile)) {
		console.error(`sync-root-stylesheet: ${cssFile} is missing`);
		process.exit(1);
	}

	const ssrDir = path.join(server, "_ssr");
	const routers = fs
		.readdirSync(ssrDir)
		.filter((name) => name.startsWith("router-") && name.endsWith(".mjs"));

	if (routers.length === 0) {
		console.error(`sync-root-stylesheet: no router bundle under ${ssrDir}`);
		process.exit(1);
	}

	for (const router of routers) {
		const routerPath = path.join(ssrDir, router);
		const source = fs.readFileSync(routerPath, "utf8");
		const patched = source.replace(
			/styles_default = "\/assets\/styles-[^"]+\.css"/g,
			`styles_default = "${canonical}"`,
		);
		fs.writeFileSync(routerPath, patched);
	}

	console.log(`sync-root-stylesheet: ok (${match[1]})`);
}

main();

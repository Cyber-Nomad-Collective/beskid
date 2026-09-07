/**
 * Align SSR router stylesheet href with the Nitro public asset map (index.mjs).
 *
 * The Nitro/TanStack SSR bundle naming changed across versions (older builds
 * emitted `router-*.mjs`; current builds emit a single `ssr.mjs`). This script
 * is naming-agnostic: it scans every `.mjs` under `.output/server/_ssr` for a
 * `styles_default = "/assets/styles-*.css"` literal and rewrites it to the
 * canonical href extracted from `index.mjs`.
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

	const stylesheet = match[1];
	if (!stylesheet) {
		console.error("sync-root-stylesheet: malformed stylesheet entry");
		process.exit(1);
	}

	const canonical = `/assets/${stylesheet}`;
	const cssFile = path.join(publicDir, stylesheet);
	if (!fs.existsSync(cssFile)) {
		console.error(`sync-root-stylesheet: ${cssFile} is missing`);
		process.exit(1);
	}

	const ssrDir = path.join(server, "_ssr");
	if (!fs.existsSync(ssrDir)) {
		console.error(`sync-root-stylesheet: missing ${ssrDir}`);
		process.exit(1);
	}

	const bundles = fs.readdirSync(ssrDir).filter((name) => name.endsWith(".mjs"));

	let seen = 0;
	let patched = 0;
	for (const bundle of bundles) {
		const bundlePath = path.join(ssrDir, bundle);
		const source = fs.readFileSync(bundlePath, "utf8");
		if (!source.includes("styles_default")) continue;
		seen += 1;
		const patchedSource = source.replace(
			/styles_default = "\/assets\/styles-[^"]+\.css"/g,
			`styles_default = "${canonical}"`,
		);
		if (patchedSource !== source) {
			fs.writeFileSync(bundlePath, patchedSource);
			patched += 1;
		}
	}

	if (seen === 0) {
		console.error(
			`sync-root-stylesheet: no bundle under ${ssrDir} contained styles_default`,
		);
		process.exit(1);
	}

	console.log(
		`sync-root-stylesheet: ok (${stylesheet}, ${seen} bundle(s), ${patched} rewritten)`,
	);
}

main();

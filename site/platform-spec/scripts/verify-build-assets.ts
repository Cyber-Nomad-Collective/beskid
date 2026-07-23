import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const server = path.join(root, ".output/server");
const publicDir = path.join(root, ".output/public/assets");

function main(): void {
	const indexMjs = path.join(server, "index.mjs");
	if (!fs.existsSync(indexMjs)) {
		console.error(`verify-build-assets: missing ${indexMjs} — run build first`);
		process.exit(1);
	}

	const indexSource = fs.readFileSync(indexMjs, "utf8");
	const match = indexSource.match(/"\/assets\/(styles-[^"]+\.css)"/);
	if (!match) {
		console.error("verify-build-assets: no stylesheet in index.mjs");
		process.exit(1);
	}

	const cssFile = path.join(publicDir, match[1]!);
	if (!fs.existsSync(cssFile)) {
		console.error(`verify-build-assets: missing ${cssFile}`);
		process.exit(1);
	}

	const ssrDir = path.join(server, "_ssr");
	const routers = fs
		.readdirSync(ssrDir)
		.filter((name) => name.startsWith("router-") && name.endsWith(".mjs"));

	for (const router of routers) {
		const source = fs.readFileSync(path.join(ssrDir, router), "utf8");
		if (!source.includes(`styles_default = "/assets/${match[1]}"`)) {
			console.error(
				`verify-build-assets: ${router} does not reference ${match[1]}`,
			);
			process.exit(1);
		}
	}

	console.log(`verify-build-assets: ok (${match[1]})`);
}

main();

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

	const stylesheet = match[1];
	if (!stylesheet) {
		console.error("verify-build-assets: malformed stylesheet entry");
		process.exit(1);
	}

	const cssFile = path.join(publicDir, stylesheet);
	if (!fs.existsSync(cssFile)) {
		console.error(`verify-build-assets: missing ${cssFile}`);
		process.exit(1);
	}
	const cssSource = fs.readFileSync(cssFile, "utf8");
	for (const selector of [
		".beskid-hub",
		".beskid-hub__tile",
		"--sidebar-width",
	]) {
		if (!cssSource.includes(selector)) {
			console.error(
				`verify-build-assets: ${stylesheet} is missing shared UI selector ${selector}`,
			);
			process.exit(1);
		}
	}

	const ssrDir = path.join(server, "_ssr");
	if (!fs.existsSync(ssrDir)) {
		console.error(`verify-build-assets: missing ${ssrDir}`);
		process.exit(1);
	}

	const bundles = fs.readdirSync(ssrDir).filter((name) => name.endsWith(".mjs"));

	const referencing = bundles.filter((name) => {
		const source = fs.readFileSync(path.join(ssrDir, name), "utf8");
		return source.includes(`styles_default = "/assets/${stylesheet}"`);
	});

	if (referencing.length === 0) {
		console.error(
			`verify-build-assets: no bundle under ${ssrDir} references ${stylesheet}`,
		);
		process.exit(1);
	}

	console.log(
		`verify-build-assets: ok (${stylesheet}, ${referencing.length} bundle(s))`,
	);
}

main();

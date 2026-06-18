#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const assets = path.join(root, ".output/public/assets");
// Match actual secret-leak vectors, not bare secret-name strings. The env
// values only reach the client bundle through the env.server module (which
// reads process.env.*) or through direct process.env.SECRET access. Bare
// secret names like "SESSION_SECRET" can legitimately appear in client-side
// UI text (e.g. the auth-hub pairing wizard shows operators which env vars
// to set) and are harmless — the name carries no value.
const forbidden =
	/env[._-]?server|process\.env\.(SESSION_SECRET|GITHUB_SYNC_TOKEN|GITHUB_WEBHOOK_SECRET|PLATFORM_SPEC_SETUP_TOKEN)/;

function main(): void {
	const verify = spawnSync(
		"bun",
		["run", path.join(import.meta.dirname, "verify-build-assets.ts")],
		{ stdio: "inherit", cwd: root },
	);
	if (verify.status !== 0) process.exit(verify.status ?? 1);

	if (!fs.existsSync(assets)) {
		console.error(`verify-client-bundle: missing ${assets}`);
		process.exit(1);
	}

	const jsFiles = fs.readdirSync(assets).filter((name) => name.endsWith(".js"));
	if (jsFiles.length === 0) {
		console.error(`verify-client-bundle: no JS files under ${assets}`);
		process.exit(1);
	}

	for (const file of jsFiles) {
		const source = fs.readFileSync(path.join(assets, file), "utf8");
		if (forbidden.test(source)) {
			console.error(`verify-client-bundle: forbidden symbols in ${file}`);
			process.exit(1);
		}
	}

	console.log(`verify-client-bundle: ok (${jsFiles.length} JS chunks)`);
}

main();

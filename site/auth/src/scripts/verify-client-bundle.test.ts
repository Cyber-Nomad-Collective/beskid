import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);
const assetsDir = path.join(rootDir, ".output/public/assets");

const FORBIDDEN = [
	"SESSION_SECRET",
	"AUTH_HUB_SECRET",
	"GITHUB_CLIENT_SECRET",
	"env.server",
] as const;

describe("client bundle secrets scan", () => {
	it.skipIf(!process.env.VERIFY_CLIENT_BUNDLE)(
		"contains no server secret env keys in client assets",
		() => {
			const files = readdirSync(assetsDir).filter((name) => name.endsWith(".js"));
			expect(files.length).toBeGreaterThan(0);

			const hits: string[] = [];
			for (const file of files) {
				const content = readFileSync(path.join(assetsDir, file), "utf8");
				for (const needle of FORBIDDEN) {
					if (content.includes(needle)) {
						hits.push(`${file}: ${needle}`);
					}
				}
			}
			expect(hits).toEqual([]);
		},
	);
});

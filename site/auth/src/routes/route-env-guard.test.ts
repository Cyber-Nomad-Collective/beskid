import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routesDir = path.dirname(fileURLToPath(import.meta.url));

function collectRouteFiles(dir: string): string[] {
	const entries = readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectRouteFiles(full));
		} else if (entry.isFile() && entry.name.endsWith(".tsx")) {
			files.push(full);
		}
	}
	return files;
}

describe("route env guard", () => {
	it("does not import server env modules from route components", () => {
		const violations: string[] = [];
		for (const file of collectRouteFiles(routesDir)) {
			const source = readFileSync(file, "utf8");
			if (!source.includes("component:")) continue;
			if (
				source.includes('from "#/env"') ||
				source.includes('from "#/env.server"')
			) {
				violations.push(path.relative(routesDir, file));
			}
		}
		expect(violations).toEqual([]);
	});

	it("imports createServerFn wrappers from .functions modules only", () => {
		const violations: string[] = [];
		for (const file of collectRouteFiles(routesDir)) {
			const source = readFileSync(file, "utf8");
			if (!source.includes("component:")) continue;
			if (
				source.includes('from "#/server/app-server"') ||
				source.includes('from "#/server/app-server.server"')
			) {
				violations.push(path.relative(routesDir, file));
			}
		}
		expect(violations).toEqual([]);
	});
});

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

function readJson(path: URL): Record<string, Record<string, string>> {
	return JSON.parse(readFileSync(fileURLToPath(path), "utf8"));
}

const workspaceRoot = new URL("../../../../", import.meta.url);

describe("TanStack runtime contract", () => {
	test("auth and platform-spec share the React Start dependency catalog", () => {
		const startPackage = readJson(
			new URL("../../node_modules/@tanstack/react-start/package.json", import.meta.url),
		);
		const workspace = readFileSync(
			fileURLToPath(new URL("pnpm-workspace.yaml", workspaceRoot)),
			"utf8",
		);
		expect(workspace).toContain("tanstack-start:");
		expect(workspace).toContain(
			`'@tanstack/react-router': ${startPackage.dependencies["@tanstack/react-router"]}`,
		);
		for (const app of ["auth", "platform-spec"]) {
			const appPackage = readJson(
				new URL(`site/${app}/package.json`, workspaceRoot),
			);
			expect(appPackage.dependencies["@tanstack/react-router"]).toBe(
				"catalog:tanstack-start",
			);
			expect(appPackage.dependencies["@tanstack/react-start"]).toBe(
				"catalog:tanstack-start",
			);
			expect(appPackage.devDependencies["@tanstack/react-router-devtools"]).toBe(
				"catalog:tanstack-start",
			);
			expect(appPackage.devDependencies["@tanstack/react-devtools"]).toBe(
				"catalog:tanstack-start",
			);
		}
	});

	test("container health checks exercise both API health and SSR root", () => {
		for (const path of [
			"site/auth/Dockerfile",
			"site/auth/docker-compose.yml",
			"site/auth/docker-compose.build.yml",
		]) {
			const deployment = readFileSync(
				fileURLToPath(new URL(path, workspaceRoot)),
				"utf8",
			);
			expect(deployment).toContain("http://127.0.0.1:8090/api/v1/health");
			expect(deployment).toContain("http://127.0.0.1:8090/");
		}

		for (const path of [
			"site/platform-spec/Dockerfile",
			"site/platform-spec/docker-compose.yml",
			"site/platform-spec/docker-compose.coolify.yml",
		]) {
			const deployment = readFileSync(
				fileURLToPath(new URL(path, workspaceRoot)),
				"utf8",
			);
			expect(deployment).toContain("http://127.0.0.1:8460/api/health");
			expect(deployment).toContain(
				"http://127.0.0.1:8460/platform-spec",
			);
		}
	});
});

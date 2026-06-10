import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCli } from "./cli.js";

describe("spec cli", () => {
	it("init and validate workspace", async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-cli-"));
		expect(await runCli(["node", "spec", "init", "--dir", dir])).toBe(0);
		expect(await runCli(["node", "spec", "validate", "--dir", dir])).toBe(0);
		fs.rmSync(dir, { recursive: true });
	});

	it("creates a node with PascalCase type flag", async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-cli-"));
		await runCli(["node", "spec", "init", "--dir", dir]);
		const code = await runCli([
			"node",
			"spec",
			"new",
			"node",
			"--dir",
			dir,
			"-t",
			"Domain",
			"--slug",
			"platform-spec/compiler",
			"--title",
			"Compiler",
		]);
		expect(code).toBe(0);
		expect(
			fs.existsSync(path.join(dir, "platform-spec/compiler/content.md")),
		).toBe(true);
		fs.rmSync(dir, { recursive: true });
	});
});

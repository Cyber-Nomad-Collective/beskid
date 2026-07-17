import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { clearSeedCache, generateSeed, loadSeed } from "#/lib/spec/static";

const roots: string[] = [];

afterEach(() => {
	clearSeedCache();
	for (const root of roots.splice(0))
		fs.rmSync(root, { recursive: true, force: true });
});

function fixture(): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-seed-"));
	roots.push(root);
	fs.mkdirSync(path.join(root, "specs", "language--syntax--blocks"), {
		recursive: true,
	});
	fs.writeFileSync(
		path.join(root, "specs", "language--syntax--blocks", "spec.md"),
		"# Blocks\n\n## Purpose\n\nDefines blocks.\n\n## Requirements\n\n### Requirement: Block delimiter\nBlocks use braces.\n",
	);
	fs.mkdirSync(path.join(root, "layouts"), { recursive: true });
	fs.writeFileSync(
		path.join(root, "layouts", "index.json"),
		JSON.stringify({ version: 1, default: "feature", bySpecLevel: { feature: "feature" } }),
	);
	fs.writeFileSync(
		path.join(root, "layouts", "feature.json"),
		JSON.stringify({
			id: "feature",
			specLevel: "feature",
			title: "Feature layout",
			requireTitle: true,
			sections: [
				{ heading: "Purpose", level: 2, required: true },
				{
					heading: "Requirements",
					level: 2,
					required: true,
					mustContainPattern: "^### Requirement:\\s+\\S",
				},
			],
		}),
	);
	fs.writeFileSync(
		path.join(root, "catalog.json"),
		JSON.stringify({
			version: 1,
			revision: "seed-rev",
			entries: [
				{
					id: "language--syntax--blocks",
					capability: "language--syntax--blocks",
					specPath: "specs/language--syntax--blocks/spec.md",
					path: "/platform-spec/capabilities/language--syntax--blocks/",
				},
			],
		}),
	);
	return root;
}

describe("static seed workspace", () => {
	it("generates a deterministic, layout-validated workspace and reloads it", () => {
		const openSpecRoot = fixture();
		const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-out-"));
		roots.push(outDir);

		const { workspace, findings } = generateSeed({ openSpecRoot, outDir });
		expect(findings).toEqual([]);
		expect(workspace.meta.counts.capabilities).toBe(1);
		expect(workspace.meta.layout.violations).toBe(0);
		expect(workspace.domainModel.domainCount).toBe(1);

		const slug = "platform-spec/capabilities/language--syntax--blocks";
		expect(workspace.documents[slug]?.layout?.id).toBe("feature");
		expect(workspace.documents[slug]?.layoutValidation.ok).toBe(true);

		for (const file of [
			"meta.json",
			"catalog.json",
			"nav-tree.json",
			"domain-model.json",
			"layouts.json",
			"documents.json",
		]) {
			expect(fs.existsSync(path.join(outDir, file))).toBe(true);
		}

		const reloaded = loadSeed(outDir);
		expect(reloaded?.meta.revision).toBe("seed-rev");
		expect(reloaded?.documents[slug]?.body).toContain(
			"### Requirement: Block delimiter",
		);
	});
});

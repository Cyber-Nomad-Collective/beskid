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
	for (const [capability, title] of [
		["taxonomy--language", "Language"],
		["taxonomy--language--syntax", "Syntax"],
		["language--syntax--blocks", "Blocks"],
	]) {
		fs.mkdirSync(path.join(root, "specs", capability), { recursive: true });
		fs.writeFileSync(
			path.join(root, "specs", capability, "spec.md"),
			`# ${title}\n\n## Purpose\n\nDefines ${title.toLowerCase()}.\n\n## Requirements\n\n### Requirement: ${title} status\nStatus.\n`,
		);
	}
	fs.mkdirSync(
		path.join(
			root,
			"documents",
			"platform-spec",
			"language--syntax--blocks",
			"articles",
		),
		{ recursive: true },
	);
	fs.writeFileSync(
		path.join(
			root,
			"documents/platform-spec/language--syntax--blocks/articles/examples.md",
		),
		"# Block examples\n\n## Purpose\n\nShow block examples.\n",
	);
	fs.mkdirSync(path.join(root, "layouts"), { recursive: true });
	fs.writeFileSync(
		path.join(root, "layouts", "index.json"),
		JSON.stringify({
			version: 1,
			default: "_default",
			bySpecLevel: {
				domain: "_default",
				area: "_default",
				feature: "feature",
				article: "article",
			},
		}),
	);
	for (const id of ["_default", "feature", "article"]) {
		fs.writeFileSync(
			path.join(root, "layouts", `${id}.json`),
			JSON.stringify({
				id,
				specLevel: id,
				title: `${id} layout`,
				requireTitle: true,
				sections: [{ heading: "Purpose", level: 2, required: true }],
			}),
		);
	}
	fs.writeFileSync(
		path.join(root, "catalog.json"),
		JSON.stringify({
			version: 1,
			revision: "seed-rev",
			entries: [
				"taxonomy--language",
				"taxonomy--language--syntax",
				"language--syntax--blocks",
			].map((capability) => ({
				id: capability,
				capability,
				specPath: `specs/${capability}/spec.md`,
			})),
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
		expect(workspace.meta.version).toBe(2);
		expect(workspace.meta.counts.capabilities).toBe(1);
		expect(workspace.meta.counts.documents).toBe(4);
		expect(workspace.meta.layout.violations).toBe(0);
		expect(workspace.domainModel.domainCount).toBe(1);

		const slug = "platform-spec/capabilities/language--syntax--blocks";
		expect(workspace.documents[slug]?.layout?.id).toBe("feature");
		expect(workspace.documents[slug]?.layoutValidation.ok).toBe(true);
		expect(
			workspace.documents[
				"platform-spec/capabilities/language--syntax--blocks/articles/examples"
			]?.kind,
		).toBe("article");
		expect(Object.keys(workspace.layouts.assignments)).toHaveLength(4);

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
			"### Requirement: Blocks status",
		);
	});

	it("produces byte-identical output across repeated generations", () => {
		const openSpecRoot = fixture();
		const seedFiles = [
			"meta.json",
			"catalog.json",
			"nav-tree.json",
			"domain-model.json",
			"layouts.json",
			"documents.json",
		];

		const generateInto = (): string => {
			const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-out-"));
			roots.push(outDir);
			generateSeed({ openSpecRoot, outDir });
			return outDir;
		};

		const first = generateInto();
		const second = generateInto();

		for (const file of seedFiles) {
			expect(fs.readFileSync(path.join(second, file))).toEqual(
				fs.readFileSync(path.join(first, file)),
			);
		}
	});
});

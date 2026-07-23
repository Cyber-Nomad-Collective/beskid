import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OpenSpecCatalogDocument } from "#/lib/spec/catalog";
import {
	resolveDocumentIdentity,
	type SpecDocumentIdentityInput,
} from "#/lib/spec/document-identity";
import { buildRows, seedSpecGraph } from "#/lib/spec/graph-seed";
import type { SeedWorkspace } from "#/lib/spec/static";

const run = vi.fn(async (_statement: string, _params?: object) => ({
	summary: { counters: { updates: () => ({ nodesDeleted: 0 }) } },
}));

vi.mock("neo4j-driver", () => ({
	default: {
		auth: { basic: vi.fn(() => ({})) },
		driver: vi.fn(() => ({
			session: () => ({ run, close: vi.fn() }),
			close: vi.fn(),
		})),
	},
}));

function document(input: SpecDocumentIdentityInput): OpenSpecCatalogDocument {
	const identity = resolveDocumentIdentity(input);
	return {
		...identity,
		identity,
		id: identity.key,
		slug: identity.publicSlug,
		title: identity.key,
		description: null,
		status: "Standard",
		pathClass: identity.artifactKind,
		sourceHash: "catalog-hash",
		specPath: identity.canonicalPath.replace(/^openspec\//, ""),
		legacySlugs: [],
		bookLinks: [],
		requirements: [],
	} as OpenSpecCatalogDocument;
}

describe("canonical graph seed rows", () => {
	beforeEach(() => run.mockClear());

	it("seeds every document kind with its canonical parent and identity", () => {
		const documents = [
			document({ kind: "domain", domain: "compiler" }),
			document({ kind: "area", domain: "compiler", area: "front-end" }),
			document({
				kind: "feature",
				domain: "compiler",
				area: "front-end",
				feature: "parser",
			}),
			document({
				kind: "article",
				domain: "compiler",
				area: "front-end",
				feature: "parser",
				article: "grammar-notes",
			}),
			document({
				kind: "decision",
				domain: "compiler",
				area: "front-end",
				feature: "parser",
				decision: "0001-parser-shape",
			}),
		];
		const workspace = {
			catalog: { documents, entries: documents },
			layouts: {
				validations: Object.fromEntries(
					documents.map((item) => [
						item.key,
						{ layoutId: item.layout, ok: true, violations: [] },
					]),
				),
			},
			documents: Object.fromEntries(
				documents.map((item) => [item.slug, { body: `# ${item.title}\n` }]),
			),
		} as unknown as SeedWorkspace;

		const rows = buildRows(workspace);
		expect(rows).toHaveLength(5);
		expect(rows.map((row) => row.kind)).toEqual([
			"taxonomy-domain",
			"taxonomy-area",
			"feature",
			"article",
			"decision",
		]);
		expect(rows.find((row) => row.kind === "taxonomy-area")).toMatchObject({
			key: "taxonomy--compiler--front-end",
			parentCapability: "taxonomy--compiler",
			repoPath: "openspec/specs/taxonomy--compiler--front-end/spec.md",
		});
		expect(rows.find((row) => row.kind === "article")).toMatchObject({
			parentCapability: "compiler--front-end--parser",
			authority: "informative",
			disposition: "informative-by-policy",
			contentHash: createHash("sha256")
				.update("# compiler--front-end--parser/articles/grammar-notes\n")
				.digest("hex"),
		});
	});

	it("prunes the retired Domain and Area graph shapes", async () => {
		const documents = [document({ kind: "domain", domain: "compiler" })];
		const workspace = {
			catalog: { documents, entries: documents },
			layouts: { validations: {} },
			documents: {},
		} as unknown as SeedWorkspace;

		await seedSpecGraph("bolt://graph.test", workspace, { prune: true });

		const statements = run.mock.calls.map(([statement]) => String(statement));
		expect(
			statements.some(
				(statement) =>
					statement.includes("legacy:Domain") && statement.includes("legacy:Area"),
			),
		).toBe(true);
	});
});

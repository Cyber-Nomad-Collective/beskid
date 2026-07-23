// Idempotent Memgraph seeding of the native-shape spec graph. Uses MERGE (the
// graph-native upsert) to converge the canonical SpecDocument hierarchy and
// its edges from the seed workspace. Pure module: neo4j-driver is
// imported dynamically so the static seed path never loads it, and it opens its
// own driver rather than the server-only client singleton, so it runs under the
// standalone seed script and the container entrypoint.

import { createHash } from "node:crypto";

import type { SeedWorkspace } from "#/lib/spec/static";

const CONSTRAINTS = [
	"CREATE CONSTRAINT ON (d:SpecDocument) ASSERT d.key IS UNIQUE",
	"CREATE CONSTRAINT ON (root:SpecRoot) ASSERT root.key IS UNIQUE",
];

const INDEXES = [
	"CREATE INDEX ON :SpecDocument(kind)",
	"CREATE INDEX ON :SpecDocument(domain)",
	"CREATE INDEX ON :SpecDocument(area)",
	"CREATE INDEX ON :SpecDocument(capability)",
	"CREATE INDEX ON :SpecDocument(parentCapability)",
];

const UPSERT = `
UNWIND $rows AS row
MERGE (s:SpecDocument {key: row.key})
  SET s.slug = row.slug, s.kind = row.kind, s.capability = row.capability,
      s.parentCapability = row.parentCapability, s.title = row.title,
      s.specLevel = row.specLevel, s.status = row.status,
      s.domain = row.domain, s.area = row.area, s.feature = row.feature,
      s.authority = row.authority, s.disposition = row.disposition,
      s.repoPath = row.repoPath, s.requirementCount = row.requirementCount,
      s.layoutId = row.layoutId, s.layoutOk = row.layoutOk,
      s.contentHash = row.contentHash, s.updatedAt = row.updatedAt
`;

const CLEAR_PARENT_EDGES = `
MATCH ()-[stale:HAS_DOCUMENT]->(:SpecDocument)
DELETE stale
`;

const LINK_ROOT_DOCUMENTS = `
MERGE (root:SpecRoot {key: "platform-spec"})
WITH root
MATCH (child:SpecDocument {parentCapability: "platform-spec"})
MERGE (root)-[:HAS_DOCUMENT]->(child)
`;

const LINK_DOCUMENTS = `
MATCH (child:SpecDocument)
WHERE child.parentCapability <> "platform-spec"
MATCH (parent:SpecDocument {key: child.parentCapability})
MERGE (parent)-[:HAS_DOCUMENT]->(child)
`;

const PRUNE = `
MATCH (s:SpecDocument)
WHERE NOT s.key IN $keys
DETACH DELETE s
`;

const PRUNE_LEGACY_TAXONOMY = `
MATCH (legacy)
WHERE legacy:Domain OR legacy:Area
DETACH DELETE legacy
`;

export interface GraphSeedResult {
	nodes: number;
	pruned: number;
}

export interface GraphRow {
	key: string;
	kind: string;
	parentCapability: string;
	authority: string;
	disposition: string;
	domain: string;
	area: string | null;
	slug: string;
	capability: string;
	title: string;
	specLevel: string;
	status: string | null;
	feature: string | null;
	repoPath: string;
	requirementCount: number;
	layoutId: string | null;
	layoutOk: boolean;
	contentHash: string;
	updatedAt: string;
}

export function buildRows(workspace: SeedWorkspace): GraphRow[] {
	const now = new Date().toISOString();
	return workspace.catalog.documents.map((document) => {
		const validation = workspace.layouts.validations[document.key];
		const bundle = workspace.documents[document.slug];
		const contentHash =
			bundle && typeof bundle.body === "string"
				? createHash("sha256").update(bundle.body).digest("hex")
				: document.sourceHash;
		return {
			key: document.key,
			kind: document.kind,
			parentCapability: document.parentCapability,
			authority: document.authority,
			disposition: document.disposition,
			domain: document.domain,
			area: document.area,
			slug: document.slug,
			capability: document.capability,
			title: document.title,
			specLevel: document.specLevel,
			status: document.status,
			feature: document.feature,
			repoPath: document.canonicalPath,
			requirementCount: document.requirements.length,
			layoutId: validation?.layoutId ?? document.layout,
			layoutOk: validation ? validation.ok : true,
			contentHash,
			updatedAt: now,
		};
	});
}

export async function seedSpecGraph(
	uri: string,
	workspace: SeedWorkspace,
	options: { prune?: boolean } = {},
): Promise<GraphSeedResult> {
	const neo4jModule = await import("neo4j-driver");
	const neo4j = neo4jModule.default ?? neo4jModule;
	const driver = neo4j.driver(uri, neo4j.auth.basic("", ""));
	const session = driver.session();
	const rows = buildRows(workspace);
	try {
		for (const statement of [...CONSTRAINTS, ...INDEXES]) {
			try {
				await session.run(statement);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				if (!message.includes("already exists")) throw error;
			}
		}
		await session.run(UPSERT, { rows });
		await session.run(CLEAR_PARENT_EDGES);
		await session.run(LINK_ROOT_DOCUMENTS);
		await session.run(LINK_DOCUMENTS);
		let pruned = 0;
		if (options.prune) {
			const keys = rows.map((row) => row.key);
			const deletedNodes = async (query: string, params?: object) => {
				const result = await session.run(query, params);
				return result.summary.counters.updates().nodesDeleted ?? 0;
			};
			pruned += await deletedNodes(PRUNE, { keys });
			pruned += await deletedNodes(PRUNE_LEGACY_TAXONOMY);
		}
		return { nodes: rows.length, pruned };
	} finally {
		await session.close();
		await driver.close();
	}
}

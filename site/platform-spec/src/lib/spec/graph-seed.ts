// Idempotent Memgraph seeding of the native-shape spec graph. Uses MERGE (the
// graph-native upsert) to converge Domain -> Area -> SpecDocument (feature)
// nodes and their edges from the seed workspace. Pure module: neo4j-driver is
// imported dynamically so the static seed path never loads it, and it opens its
// own driver rather than the server-only client singleton, so it runs under the
// standalone seed script and the container entrypoint.

import type { SeedWorkspace } from "#/lib/spec/static";

const CONSTRAINTS = [
	"CREATE CONSTRAINT ON (d:SpecDocument) ASSERT d.slug IS UNIQUE",
	"CREATE CONSTRAINT ON (dom:Domain) ASSERT dom.domain IS UNIQUE",
	"CREATE CONSTRAINT ON (ar:Area) ASSERT ar.id IS UNIQUE",
];

const INDEXES = [
	"CREATE INDEX ON :SpecDocument(domain)",
	"CREATE INDEX ON :SpecDocument(area)",
	"CREATE INDEX ON :SpecDocument(capability)",
	"CREATE INDEX ON :Area(domain)",
];

const UPSERT = `
UNWIND $rows AS row
MERGE (d:Domain {domain: row.domain})
  SET d.title = row.domainTitle, d.updatedAt = row.updatedAt
MERGE (a:Area {id: row.areaId})
  SET a.domain = row.domain, a.area = row.area, a.title = row.areaTitle,
      a.updatedAt = row.updatedAt
MERGE (d)-[:HAS_AREA]->(a)
MERGE (s:SpecDocument {slug: row.slug})
  SET s.capability = row.capability, s.title = row.title,
      s.specLevel = row.specLevel, s.status = row.status,
      s.domain = row.domain, s.area = row.area, s.feature = row.feature,
      s.repoPath = row.repoPath, s.requirementCount = row.requirementCount,
      s.layoutId = row.layoutId, s.layoutOk = row.layoutOk,
      s.contentHash = row.contentHash, s.updatedAt = row.updatedAt
MERGE (a)-[:HAS_FEATURE]->(s)
`;

const PRUNE = `
MATCH (s:SpecDocument)
WHERE NOT s.slug IN $slugs
DETACH DELETE s
`;

export interface GraphSeedResult {
	nodes: number;
	pruned: number;
}

interface GraphRow {
	domain: string;
	domainTitle: string;
	areaId: string;
	area: string;
	areaTitle: string;
	slug: string;
	capability: string;
	title: string;
	specLevel: string;
	status: string | null;
	feature: string;
	repoPath: string;
	requirementCount: number;
	layoutId: string | null;
	layoutOk: boolean;
	contentHash: string;
	updatedAt: string;
}

function buildRows(workspace: SeedWorkspace): GraphRow[] {
	const now = new Date().toISOString();
	const rows: GraphRow[] = [];
	for (const domain of workspace.domainModel.domains) {
		for (const area of domain.areas) {
			for (const feature of area.features) {
				const validation = workspace.layouts.validations[feature.capability];
				const bundle = workspace.documents[feature.slug];
				const contentHash =
					bundle && typeof bundle.body === "string"
						? String(bundle.body.length)
						: "0";
				rows.push({
					domain: domain.domain,
					domainTitle: domain.title,
					areaId: `${domain.domain}/${area.area}`,
					area: area.area,
					areaTitle: area.title,
					slug: feature.slug,
					capability: feature.capability,
					title: feature.title,
					specLevel: feature.specLevel,
					status: feature.status,
					feature: feature.feature,
					repoPath: `openspec/specs/${feature.capability}/spec.md`,
					requirementCount: feature.requirementCount,
					layoutId: validation?.layoutId ?? null,
					layoutOk: validation ? validation.ok : true,
					contentHash,
					updatedAt: now,
				});
			}
		}
	}
	return rows;
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
		let pruned = 0;
		if (options.prune) {
			const slugs = rows.map((row) => row.slug);
			const result = await session.run(PRUNE, { slugs });
			pruned = result.summary.counters.updates().nodesDeleted ?? 0;
		}
		return { nodes: rows.length, pruned };
	} finally {
		await session.close();
		await driver.close();
	}
}

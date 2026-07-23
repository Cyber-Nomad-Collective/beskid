import { runQuery } from "./client";

const CONSTRAINTS = [
	"CREATE CONSTRAINT ON (d:SpecDocument) ASSERT d.slug IS UNIQUE",
	"CREATE CONSTRAINT ON (dom:Domain) ASSERT dom.domain IS UNIQUE",
	"CREATE CONSTRAINT ON (ar:Area) ASSERT ar.id IS UNIQUE",
	"CREATE CONSTRAINT ON (c:DraftContext) ASSERT c.id IS UNIQUE",
	"CREATE CONSTRAINT ON (dc:DraftDocumentChange) ASSERT dc.id IS UNIQUE",
	"CREATE CONSTRAINT ON (r:DraftContextRevision) ASSERT r.id IS UNIQUE",
	"CREATE CONSTRAINT ON (u:User) ASSERT u.login IS UNIQUE",
] as const;

const INDEXES = [
	"CREATE INDEX ON :SpecDocument(repoPath)",
	"CREATE INDEX ON :SpecDocument(specLevel)",
	"CREATE INDEX ON :SpecDocument(domain)",
	"CREATE INDEX ON :SpecDocument(area)",
	"CREATE INDEX ON :SpecDocument(capability)",
	"CREATE INDEX ON :Area(domain)",
	"CREATE INDEX ON :DraftContext(status)",
	"CREATE INDEX ON :DraftContext(authorLogin)",
	"CREATE INDEX ON :DraftContext(prNumber)",
	"CREATE INDEX ON :DraftContext(headBranch)",
	"CREATE INDEX ON :DraftDocumentChange(contextId)",
	"CREATE INDEX ON :DraftDocumentChange(canonicalPath)",
	"CREATE INDEX ON :DraftContextRevision(contextId)",
	"CREATE INDEX ON :User(isModerator)",
] as const;

export async function ensureSchema(): Promise<void> {
	for (const statement of CONSTRAINTS) {
		try {
			await runQuery(statement);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!message.includes("already exists")) {
				throw error;
			}
		}
	}

	for (const statement of INDEXES) {
		try {
			await runQuery(statement);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!message.includes("already exists")) {
				throw error;
			}
		}
	}
}

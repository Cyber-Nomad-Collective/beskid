import { runQuery, runWrite } from "#/server/memgraph/client";
import {
	appendRevision,
	emptyValidation,
	ensureReady,
	getDraftContext,
	hashMarkdown,
	nowIso,
} from "#/server/memgraph/draft-contexts/shared";
import type {
	DraftContext,
	DraftContextStatus,
	DraftDocumentChange,
	DraftDocumentOperation,
} from "#/server/memgraph/types";

/** One-shot migration: convert legacy DraftChange nodes into DraftContext bundles. */
export async function migrateLegacyDraftChanges(): Promise<number> {
	await ensureReady();
	const rows = await runQuery<{ props: Record<string, unknown> }>(
		`MATCH (d:DraftChange) RETURN properties(d) AS props`,
	);
	let migrated = 0;
	for (const row of rows) {
		const legacy = row.props;
		const id = String(legacy.id ?? "");
		if (!id) continue;
		const existing = await getDraftContext(id);
		if (existing) {
			await runWrite(`MATCH (d:DraftChange {id: $id}) DETACH DELETE d`, { id });
			continue;
		}

		const createdAt = String(legacy.createdAt ?? nowIso());
		const bodyMd = String(legacy.bodyMd ?? "");
		const repoPath = String(legacy.repoPath ?? "");
		const slug = String(legacy.slug ?? "");
		const context: DraftContext = {
			id,
			title: String(legacy.title ?? "Migrated draft"),
			summary: String(legacy.summary ?? ""),
			baseCatalogRevision: "migrated-unknown",
			status: (legacy.status as DraftContextStatus) ?? "draft",
			authorLogin: String(legacy.authorLogin ?? "unknown"),
			moderatorLogin: (legacy.moderatorLogin as string | null) ?? null,
			rejectReason: (legacy.rejectReason as string | null) ?? null,
			validationState: "unknown",
			validationRevision: null,
			headBranch: (legacy.headBranch as string | null) ?? null,
			prNumber: (legacy.prNumber as number | null) ?? null,
			prUrl: (legacy.prUrl as string | null) ?? null,
			trackerTaskIdsJson: "[]",
			deliveryVersionId: null,
			createdAt,
			updatedAt: String(legacy.updatedAt ?? createdAt),
		};

		const identity = {
			artifactKind: "feature" as const,
			kind: "feature" as const,
			key: repoPath.replace(/^openspec\/specs\//, "").replace(/\/spec\.md$/, ""),
			capability: repoPath
				.replace(/^openspec\/specs\//, "")
				.replace(/\/spec\.md$/, ""),
			canonicalPath: repoPath,
			publicSlug: slug,
			href: `/${slug}/`,
			parentCapability: "platform-spec",
			parentSlug: "platform-spec",
			authority: "normative" as const,
			disposition: "normative-standard" as const,
			layout: "feature" as const,
			specLevel: "feature" as const,
			domain: "migrated",
			area: "legacy",
			feature: "draft",
			article: null,
			decision: null,
		};

		const change: DraftDocumentChange = {
			id: crypto.randomUUID(),
			contextId: id,
			ordinal: 0,
			operation: (legacy.changeKind as DraftDocumentOperation) ?? "update",
			artifactKind: "feature",
			identityJson: JSON.stringify(identity),
			canonicalPath: repoPath,
			publicSlug: slug,
			layoutId: "feature",
			sourceMarkdown: bodyMd,
			baseMarkdown: null,
			baseContentHash: null,
			contentHash: hashMarkdown(bodyMd),
			moderatorNote: null,
			validationJson: JSON.stringify(emptyValidation()),
			createdAt,
			updatedAt: context.updatedAt,
		};

		await runWrite(
			`
			CREATE (c:DraftContext {id: $id})
			SET c += $contextProps
			CREATE (d:DraftDocumentChange {id: $changeId})
			SET d += $changeProps
			CREATE (c)-[:CONTAINS]->(d)
			WITH c
			MERGE (u:User {login: $authorLogin})
			ON CREATE SET u.displayName = null, u.isModerator = false, u.createdAt = $createdAt, u.lastSeenAt = $createdAt
			MERGE (u)-[:AUTHORED]->(c)
			`,
			{
				id,
				contextProps: context,
				changeId: change.id,
				changeProps: change,
				authorLogin: context.authorLogin,
				createdAt,
			},
		);
		await appendRevision(context, [change], context.authorLogin);
		await runWrite(`MATCH (d:DraftChange {id: $id}) DETACH DELETE d`, { id });
		migrated += 1;
	}
	return migrated;
}

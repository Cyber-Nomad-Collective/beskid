import { createHash } from "node:crypto";

import "@tanstack/react-start/server-only";

import type { SpecDocumentIdentity } from "#/lib/spec/document-identity";
import {
	ensureMemgraphReady,
	runQuery,
	runWrite,
} from "#/server/memgraph/client";
import type {
	DraftContext,
	DraftContextBundle,
	DraftContextRevision,
	DraftContextStatus,
	DraftDocumentChange,
	DraftDocumentOperation,
	DraftValidationResult,
	DraftValidationState,
	ParsedDraftContextBundle,
	ParsedDraftDocumentChange,
} from "#/server/memgraph/types";

function nowIso(): string {
	return new Date().toISOString();
}

export function hashMarkdown(source: string): string {
	return createHash("sha256").update(source, "utf8").digest("hex");
}

function emptyValidation(): DraftValidationResult {
	return { ok: true, issues: [] };
}

function parseValidation(json: string): DraftValidationResult {
	try {
		const parsed = JSON.parse(json) as DraftValidationResult;
		if (
			parsed &&
			typeof parsed.ok === "boolean" &&
			Array.isArray(parsed.issues)
		) {
			return parsed;
		}
	} catch {
		/* fall through */
	}
	return emptyValidation();
}

function parseIdentity(json: string): SpecDocumentIdentity {
	return JSON.parse(json) as SpecDocumentIdentity;
}

function parseTrackerTaskIds(json: string): string[] {
	try {
		const parsed = JSON.parse(json) as unknown;
		if (Array.isArray(parsed)) {
			return parsed.filter((id): id is string => typeof id === "string");
		}
	} catch {
		/* fall through */
	}
	return [];
}

function mapChange(props: DraftDocumentChange): ParsedDraftDocumentChange {
	const { identityJson, validationJson, ...rest } = props;
	return {
		...rest,
		identity: parseIdentity(identityJson),
		validation: parseValidation(validationJson),
	};
}

function mapBundle(
	context: DraftContext,
	documentChanges: DraftDocumentChange[],
	revisions: DraftContextRevision[],
): ParsedDraftContextBundle {
	return {
		context,
		documentChanges: documentChanges
			.slice()
			.sort((a, b) => a.ordinal - b.ordinal)
			.map(mapChange),
		revisions: revisions.slice().sort((a, b) => a.ordinal - b.ordinal),
		trackerTaskIds: parseTrackerTaskIds(context.trackerTaskIdsJson),
	};
}

async function ensureReady(): Promise<void> {
	await ensureMemgraphReady();
}

async function loadRevisions(
	contextId: string,
): Promise<DraftContextRevision[]> {
	const rows = await runQuery<{ props: DraftContextRevision }>(
		`
		MATCH (c:DraftContext {id: $contextId})-[:HAS_REVISION]->(r:DraftContextRevision)
		RETURN properties(r) AS props
		ORDER BY r.ordinal ASC
		`,
		{ contextId },
	);
	return rows.map((row) => row.props);
}

async function loadChanges(contextId: string): Promise<DraftDocumentChange[]> {
	const rows = await runQuery<{ props: DraftDocumentChange }>(
		`
		MATCH (c:DraftContext {id: $contextId})-[:CONTAINS]->(d:DraftDocumentChange)
		RETURN properties(d) AS props
		ORDER BY d.ordinal ASC
		`,
		{ contextId },
	);
	return rows.map((row) => row.props);
}

async function getContextNode(id: string): Promise<DraftContext | null> {
	const rows = await runQuery<{ props: DraftContext }>(
		`MATCH (c:DraftContext {id: $id}) RETURN properties(c) AS props`,
		{ id },
	);
	return rows[0]?.props ?? null;
}

export async function getDraftContext(
	id: string,
): Promise<ParsedDraftContextBundle | null> {
	await ensureReady();
	const context = await getContextNode(id);
	if (!context) return null;
	const [documentChanges, revisions] = await Promise.all([
		loadChanges(id),
		loadRevisions(id),
	]);
	return mapBundle(context, documentChanges, revisions);
}

function assertEditable(status: DraftContextStatus): void {
	if (status !== "draft" && status !== "rejected") {
		throw new Error("Cannot edit draft context after submission");
	}
}

async function appendRevision(
	context: DraftContext,
	documentChanges: DraftDocumentChange[],
	authorLogin: string,
): Promise<DraftContextRevision> {
	const existing = await loadRevisions(context.id);
	const ordinal = existing.length;
	const createdAt = nowIso();
	const revision: DraftContextRevision = {
		id: crypto.randomUUID(),
		contextId: context.id,
		ordinal,
		authorLogin,
		snapshotJson: JSON.stringify({
			title: context.title,
			summary: context.summary,
			baseCatalogRevision: context.baseCatalogRevision,
			status: context.status,
			validationState: context.validationState,
			trackerTaskIdsJson: context.trackerTaskIdsJson,
			deliveryVersionId: context.deliveryVersionId,
			documentChanges: documentChanges.map((change) => ({
				id: change.id,
				ordinal: change.ordinal,
				operation: change.operation,
				canonicalPath: change.canonicalPath,
				contentHash: change.contentHash,
				sourceMarkdown: change.sourceMarkdown,
			})),
		}),
		createdAt,
	};
	await runWrite(
		`
		MATCH (c:DraftContext {id: $contextId})
		CREATE (r:DraftContextRevision {id: $id})
		SET r += $props
		CREATE (c)-[:HAS_REVISION]->(r)
		`,
		{ contextId: context.id, id: revision.id, props: revision },
	);
	return revision;
}

export interface CreateDraftContextInput {
	id: string;
	title: string;
	summary?: string;
	baseCatalogRevision: string;
	authorLogin: string;
	trackerTaskIds?: string[];
	deliveryVersionId?: string | null;
}

export async function createDraftContext(
	input: CreateDraftContextInput,
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const createdAt = nowIso();
	const context: DraftContext = {
		id: input.id,
		title: input.title.trim(),
		summary: input.summary?.trim() ?? "",
		baseCatalogRevision: input.baseCatalogRevision,
		status: "draft",
		authorLogin: input.authorLogin,
		moderatorLogin: null,
		rejectReason: null,
		validationState: "unknown",
		validationRevision: null,
		headBranch: null,
		prNumber: null,
		prUrl: null,
		trackerTaskIdsJson: JSON.stringify(input.trackerTaskIds ?? []),
		deliveryVersionId: input.deliveryVersionId ?? null,
		createdAt,
		updatedAt: createdAt,
	};

	await runWrite(
		`
		CREATE (c:DraftContext {id: $id})
		SET c += $props
		WITH c
		MERGE (u:User {login: $authorLogin})
		ON CREATE SET u.displayName = null, u.isModerator = false, u.createdAt = $createdAt, u.lastSeenAt = $createdAt
		MERGE (u)-[:AUTHORED]->(c)
		`,
		{
			id: input.id,
			props: context,
			authorLogin: input.authorLogin,
			createdAt,
		},
	);

	await appendRevision(context, [], input.authorLogin);
	return getDraftContext(input.id) as Promise<ParsedDraftContextBundle>;
}

export interface AddDraftDocumentInput {
	contextId: string;
	operation: DraftDocumentOperation;
	identity: SpecDocumentIdentity;
	sourceMarkdown: string;
	baseMarkdown?: string | null;
	baseContentHash?: string | null;
	layoutId: string;
	validation?: DraftValidationResult;
	actorLogin: string;
}

export async function addDraftDocument(
	input: AddDraftDocumentInput,
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const existing = await getDraftContext(input.contextId);
	if (!existing) throw new Error("Draft context not found");
	assertEditable(existing.context.status);

	const updatedAt = nowIso();
	const ordinal = existing.documentChanges.length;
	const change: DraftDocumentChange = {
		id: crypto.randomUUID(),
		contextId: input.contextId,
		ordinal,
		operation: input.operation,
		artifactKind: input.identity.artifactKind,
		identityJson: JSON.stringify(input.identity),
		canonicalPath: input.identity.canonicalPath,
		publicSlug: input.identity.publicSlug,
		layoutId: input.layoutId,
		sourceMarkdown: input.sourceMarkdown,
		baseMarkdown: input.baseMarkdown ?? null,
		baseContentHash: input.baseContentHash ?? null,
		contentHash: hashMarkdown(input.sourceMarkdown),
		moderatorNote: null,
		validationJson: JSON.stringify(input.validation ?? emptyValidation()),
		createdAt: updatedAt,
		updatedAt,
	};

	const context: DraftContext = {
		...existing.context,
		status:
			existing.context.status === "rejected" ? "draft" : existing.context.status,
		rejectReason:
			existing.context.status === "rejected"
				? null
				: existing.context.rejectReason,
		validationState: "unknown",
		validationRevision: null,
		updatedAt,
	};

	await runWrite(
		`
		MATCH (c:DraftContext {id: $contextId})
		SET c += $contextProps
		CREATE (d:DraftDocumentChange {id: $changeId})
		SET d += $changeProps
		CREATE (c)-[:CONTAINS]->(d)
		`,
		{
			contextId: input.contextId,
			contextProps: context,
			changeId: change.id,
			changeProps: change,
		},
	);

	const changes = [...(await loadChanges(input.contextId))];
	await appendRevision(context, changes, input.actorLogin);
	return getDraftContext(input.contextId) as Promise<ParsedDraftContextBundle>;
}

export interface UpdateDraftDocumentInput {
	contextId: string;
	documentChangeId: string;
	sourceMarkdown?: string;
	operation?: DraftDocumentOperation;
	validation?: DraftValidationResult;
	moderatorNote?: string | null;
	actorLogin: string;
}

export async function updateDraftDocument(
	input: UpdateDraftDocumentInput,
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const existing = await getDraftContext(input.contextId);
	if (!existing) throw new Error("Draft context not found");
	assertEditable(existing.context.status);

	const current = existing.documentChanges.find(
		(change) => change.id === input.documentChangeId,
	);
	if (!current) throw new Error("Document change not found");

	const updatedAt = nowIso();
	const sourceMarkdown = input.sourceMarkdown ?? current.sourceMarkdown;
	const change: DraftDocumentChange = {
		id: current.id,
		contextId: current.contextId,
		ordinal: current.ordinal,
		operation: input.operation ?? current.operation,
		artifactKind: current.artifactKind,
		identityJson: JSON.stringify(current.identity),
		canonicalPath: current.canonicalPath,
		publicSlug: current.publicSlug,
		layoutId: current.layoutId,
		sourceMarkdown,
		baseMarkdown: current.baseMarkdown,
		baseContentHash: current.baseContentHash,
		contentHash: hashMarkdown(sourceMarkdown),
		moderatorNote:
			input.moderatorNote !== undefined
				? input.moderatorNote
				: current.moderatorNote,
		validationJson: JSON.stringify(input.validation ?? current.validation),
		createdAt: current.createdAt,
		updatedAt,
	};

	const context: DraftContext = {
		...existing.context,
		status:
			existing.context.status === "rejected" ? "draft" : existing.context.status,
		rejectReason:
			existing.context.status === "rejected"
				? null
				: existing.context.rejectReason,
		validationState: "unknown",
		validationRevision: null,
		updatedAt,
	};

	await runWrite(
		`
		MATCH (c:DraftContext {id: $contextId})
		SET c += $contextProps
		WITH c
		MATCH (d:DraftDocumentChange {id: $changeId})
		SET d += $changeProps
		`,
		{
			contextId: input.contextId,
			contextProps: context,
			changeId: change.id,
			changeProps: change,
		},
	);

	const changes = await loadChanges(input.contextId);
	await appendRevision(context, changes, input.actorLogin);
	return getDraftContext(input.contextId) as Promise<ParsedDraftContextBundle>;
}

export async function removeDraftDocument(
	contextId: string,
	documentChangeId: string,
	actorLogin: string,
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const existing = await getDraftContext(contextId);
	if (!existing) throw new Error("Draft context not found");
	assertEditable(existing.context.status);

	const updatedAt = nowIso();
	await runWrite(`MATCH (d:DraftDocumentChange {id: $id}) DETACH DELETE d`, {
		id: documentChangeId,
	});

	const remaining = await loadChanges(contextId);
	for (const [index, change] of remaining.entries()) {
		if (change.ordinal !== index) {
			await runWrite(
				`MATCH (d:DraftDocumentChange {id: $id}) SET d.ordinal = $ordinal, d.updatedAt = $updatedAt`,
				{ id: change.id, ordinal: index, updatedAt },
			);
		}
	}

	const context: DraftContext = {
		...existing.context,
		status:
			existing.context.status === "rejected" ? "draft" : existing.context.status,
		rejectReason:
			existing.context.status === "rejected"
				? null
				: existing.context.rejectReason,
		validationState: "unknown",
		validationRevision: null,
		updatedAt,
	};
	await runWrite(`MATCH (c:DraftContext {id: $id}) SET c += $props`, {
		id: contextId,
		props: context,
	});
	await appendRevision(context, await loadChanges(contextId), actorLogin);
	return getDraftContext(contextId) as Promise<ParsedDraftContextBundle>;
}

export async function updateDraftContextMeta(
	id: string,
	input: {
		title?: string;
		summary?: string;
		trackerTaskIds?: string[];
		deliveryVersionId?: string | null;
		baseCatalogRevision?: string;
		validationState?: DraftValidationState;
		validationRevision?: string | null;
	},
	actorLogin: string,
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const existing = await getDraftContext(id);
	if (!existing) throw new Error("Draft context not found");
	assertEditable(existing.context.status);

	const updatedAt = nowIso();
	const context: DraftContext = {
		...existing.context,
		title: input.title?.trim() ?? existing.context.title,
		summary: input.summary?.trim() ?? existing.context.summary,
		trackerTaskIdsJson:
			input.trackerTaskIds !== undefined
				? JSON.stringify(input.trackerTaskIds)
				: existing.context.trackerTaskIdsJson,
		deliveryVersionId:
			input.deliveryVersionId !== undefined
				? input.deliveryVersionId
				: existing.context.deliveryVersionId,
		baseCatalogRevision:
			input.baseCatalogRevision ?? existing.context.baseCatalogRevision,
		validationState: input.validationState ?? existing.context.validationState,
		validationRevision:
			input.validationRevision !== undefined
				? input.validationRevision
				: existing.context.validationRevision,
		status:
			existing.context.status === "rejected" ? "draft" : existing.context.status,
		rejectReason:
			existing.context.status === "rejected"
				? null
				: existing.context.rejectReason,
		updatedAt,
	};

	await runWrite(`MATCH (c:DraftContext {id: $id}) SET c += $props`, {
		id,
		props: context,
	});
	await appendRevision(context, await loadChanges(id), actorLogin);
	return getDraftContext(id) as Promise<ParsedDraftContextBundle>;
}

export async function deleteDraftContext(id: string): Promise<boolean> {
	await ensureReady();
	const existing = await getDraftContext(id);
	if (!existing) return false;
	assertEditable(existing.context.status);
	await runWrite(
		`
		MATCH (c:DraftContext {id: $id})
		OPTIONAL MATCH (c)-[:CONTAINS]->(d:DraftDocumentChange)
		OPTIONAL MATCH (c)-[:HAS_REVISION]->(r:DraftContextRevision)
		DETACH DELETE d, r, c
		`,
		{ id },
	);
	return true;
}

export async function listDraftContextsForUser(
	authorLogin: string,
): Promise<DraftContext[]> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftContext }>(
		`
		MATCH (c:DraftContext {authorLogin: $authorLogin})
		RETURN properties(c) AS props
		ORDER BY c.updatedAt DESC
		`,
		{ authorLogin },
	);
	return rows.map((row) => row.props);
}

export async function listPendingDraftContexts(): Promise<
	ParsedDraftContextBundle[]
> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftContext }>(
		`
		MATCH (c:DraftContext {status: 'submitted'})
		RETURN properties(c) AS props
		ORDER BY c.updatedAt ASC
		`,
	);
	const bundles: ParsedDraftContextBundle[] = [];
	for (const row of rows) {
		const bundle = await getDraftContext(row.props.id);
		if (bundle) bundles.push(bundle);
	}
	return bundles;
}

export async function submitDraftContext(
	id: string,
	validationState: DraftValidationState,
	validationRevision: string,
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const existing = await getDraftContext(id);
	if (!existing) throw new Error("Draft context not found");
	if (
		existing.context.status !== "draft" &&
		existing.context.status !== "rejected"
	) {
		throw new Error("Draft context is not editable");
	}
	if (validationState !== "valid") {
		throw new Error("validation");
	}
	const updatedAt = nowIso();
	const context: DraftContext = {
		...existing.context,
		status: "submitted",
		validationState,
		validationRevision,
		updatedAt,
	};
	await runWrite(`MATCH (c:DraftContext {id: $id}) SET c += $props`, {
		id,
		props: context,
	});
	await appendRevision(
		context,
		await loadChanges(id),
		existing.context.authorLogin,
	);
	return getDraftContext(id) as Promise<ParsedDraftContextBundle>;
}

export async function approveDraftContext(
	id: string,
	moderatorLogin: string,
	updates: { headBranch?: string; prNumber?: number; prUrl?: string },
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const existing = await getDraftContext(id);
	if (!existing) throw new Error("Draft context not found");
	if (existing.context.status !== "submitted") {
		throw new Error("Only submitted draft contexts can be approved");
	}
	const updatedAt = nowIso();
	const context: DraftContext = {
		...existing.context,
		status: "approved",
		moderatorLogin,
		updatedAt,
		headBranch: updates.headBranch ?? existing.context.headBranch,
		prNumber: updates.prNumber ?? existing.context.prNumber,
		prUrl: updates.prUrl ?? existing.context.prUrl,
	};
	await runWrite(`MATCH (c:DraftContext {id: $id}) SET c += $props`, {
		id,
		props: context,
	});
	await appendRevision(context, await loadChanges(id), moderatorLogin);
	return getDraftContext(id) as Promise<ParsedDraftContextBundle>;
}

export async function rejectDraftContext(
	id: string,
	moderatorLogin: string,
	rejectReason: string,
	documentNotes?: Array<{ documentChangeId: string; note: string }>,
): Promise<ParsedDraftContextBundle> {
	await ensureReady();
	const existing = await getDraftContext(id);
	if (!existing) throw new Error("Draft context not found");
	if (existing.context.status !== "submitted") {
		throw new Error("Only submitted draft contexts can be rejected");
	}
	const updatedAt = nowIso();
	if (documentNotes) {
		for (const note of documentNotes) {
			await runWrite(
				`
				MATCH (d:DraftDocumentChange {id: $id})
				SET d.moderatorNote = $note, d.updatedAt = $updatedAt
				`,
				{ id: note.documentChangeId, note: note.note, updatedAt },
			);
		}
	}
	const context: DraftContext = {
		...existing.context,
		status: "rejected",
		moderatorLogin,
		rejectReason: rejectReason.trim(),
		updatedAt,
	};
	await runWrite(`MATCH (c:DraftContext {id: $id}) SET c += $props`, {
		id,
		props: context,
	});
	await appendRevision(context, await loadChanges(id), moderatorLogin);
	return getDraftContext(id) as Promise<ParsedDraftContextBundle>;
}

export async function markDraftContextMerged(
	id: string,
): Promise<ParsedDraftContextBundle | null> {
	await ensureReady();
	const existing = await getDraftContext(id);
	if (!existing) return null;
	const updatedAt = nowIso();
	const context: DraftContext = {
		...existing.context,
		status: "merged",
		updatedAt,
	};
	await runWrite(`MATCH (c:DraftContext {id: $id}) SET c += $props`, {
		id,
		props: context,
	});
	return getDraftContext(id);
}

export async function markDraftContextAbandoned(
	id: string,
): Promise<ParsedDraftContextBundle | null> {
	await ensureReady();
	const existing = await getDraftContext(id);
	if (!existing) return null;
	if (existing.context.status === "merged") return existing;
	const updatedAt = nowIso();
	const context: DraftContext = {
		...existing.context,
		status: "abandoned",
		updatedAt,
	};
	await runWrite(`MATCH (c:DraftContext {id: $id}) SET c += $props`, {
		id,
		props: context,
	});
	return getDraftContext(id);
}

export async function findDraftContextByPrNumber(
	prNumber: number,
): Promise<ParsedDraftContextBundle | null> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftContext }>(
		`MATCH (c:DraftContext {prNumber: $prNumber}) RETURN properties(c) AS props LIMIT 1`,
		{ prNumber },
	);
	if (!rows[0]) return null;
	return getDraftContext(rows[0].props.id);
}

export async function findDraftContextByHeadBranch(
	headBranch: string,
): Promise<ParsedDraftContextBundle | null> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftContext }>(
		`MATCH (c:DraftContext {headBranch: $headBranch}) RETURN properties(c) AS props LIMIT 1`,
		{ headBranch },
	);
	if (!rows[0]) return null;
	return getDraftContext(rows[0].props.id);
}

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

export type { DraftContextBundle };

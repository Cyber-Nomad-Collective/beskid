import type { SpecDocumentIdentity } from "#/lib/spec/document-identity";
import { runWrite } from "#/server/memgraph/client";
import {
	appendRevision,
	assertEditable,
	emptyValidation,
	ensureReady,
	getDraftContext,
	hashMarkdown,
	loadChanges,
	nowIso,
} from "#/server/memgraph/draft-contexts/shared";
import type {
	DraftContext,
	DraftDocumentChange,
	DraftDocumentOperation,
	DraftValidationResult,
	DraftValidationState,
	ParsedDraftContextBundle,
} from "#/server/memgraph/types";

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

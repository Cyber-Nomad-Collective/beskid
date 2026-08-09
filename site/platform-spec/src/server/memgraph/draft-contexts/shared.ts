import { createHash } from "node:crypto";

import type { SpecDocumentIdentity } from "#/lib/spec/document-identity";
import {
	ensureMemgraphReady,
	runQuery,
	runWrite,
} from "#/server/memgraph/client";
import type {
	DraftContext,
	DraftContextRevision,
	DraftContextStatus,
	DraftDocumentChange,
	DraftValidationResult,
	ParsedDraftContextBundle,
	ParsedDraftDocumentChange,
} from "#/server/memgraph/types";

export function nowIso(): string {
	return new Date().toISOString();
}

export function hashMarkdown(source: string): string {
	return createHash("sha256").update(source, "utf8").digest("hex");
}

export function emptyValidation(): DraftValidationResult {
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

export async function ensureReady(): Promise<void> {
	await ensureMemgraphReady();
}

export async function loadRevisions(
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

export async function loadChanges(
	contextId: string,
): Promise<DraftDocumentChange[]> {
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

export function assertEditable(status: DraftContextStatus): void {
	if (status !== "draft" && status !== "rejected") {
		throw new Error("Cannot edit draft context after submission");
	}
}

export async function appendRevision(
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

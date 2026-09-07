import { runQuery, runWrite } from "#/server/memgraph/client";
import {
	appendRevision,
	ensureReady,
	getDraftContext,
	loadChanges,
	nowIso,
} from "#/server/memgraph/draft-contexts/shared";
import type {
	DraftContext,
	DraftValidationState,
	ParsedDraftContextBundle,
} from "#/server/memgraph/types";

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

import "@tanstack/react-start/server-only";

import {
	ensureMemgraphReady,
	runQuery,
	runWrite,
} from "#/server/memgraph/client";
import type {
	DraftChangeKind,
	DraftChangeNode,
	DraftChangeStatus,
	SpecLevel,
} from "#/server/memgraph/types";

type DraftProps = DraftChangeNode;

function mapDraft(row: { props: DraftProps }): DraftChangeNode {
	return row.props;
}

function nowIso(): string {
	return new Date().toISOString();
}

export interface CreateDraftInput {
	id: string;
	title: string;
	summary?: string;
	changeKind: DraftChangeKind;
	repoPath: string;
	slug: string;
	pathClass: string;
	specLevel: SpecLevel;
	frontmatterJson: string;
	bodyMd: string;
	layoutJson?: string | null;
	authorLogin: string;
}

export interface UpdateDraftInput {
	title?: string;
	summary?: string;
	changeKind?: DraftChangeKind;
	repoPath?: string;
	slug?: string;
	pathClass?: string;
	specLevel?: SpecLevel;
	frontmatterJson?: string;
	bodyMd?: string;
	layoutJson?: string | null;
}

async function ensureReady(): Promise<void> {
	await ensureMemgraphReady();
}

export async function createDraft(input: CreateDraftInput): Promise<DraftChangeNode> {
	await ensureReady();
	const createdAt = nowIso();
	const props: DraftProps = {
		id: input.id,
		title: input.title,
		summary: input.summary ?? "",
		changeKind: input.changeKind,
		repoPath: input.repoPath,
		slug: input.slug,
		pathClass: input.pathClass,
		specLevel: input.specLevel,
		frontmatterJson: input.frontmatterJson,
		bodyMd: input.bodyMd,
		layoutJson: input.layoutJson ?? null,
		status: "draft",
		authorLogin: input.authorLogin,
		moderatorLogin: null,
		rejectReason: null,
		headBranch: null,
		prNumber: null,
		prUrl: null,
		createdAt,
		updatedAt: createdAt,
	};

	await runWrite(
		`
		CREATE (d:DraftChange {id: $id})
		SET d += $props
		WITH d
		MERGE (u:User {login: $authorLogin})
		ON CREATE SET u.displayName = null, u.isModerator = false, u.createdAt = $createdAt, u.lastSeenAt = $createdAt
		MERGE (u)-[:AUTHORED]->(d)
		`,
		{ id: input.id, props, authorLogin: input.authorLogin, createdAt },
	);

	return props;
}

export async function getDraft(id: string): Promise<DraftChangeNode | null> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftProps }>(
		`MATCH (d:DraftChange {id: $id}) RETURN properties(d) AS props`,
		{ id },
	);
	if (rows.length === 0) return null;
	return mapDraft(rows[0]);
}

export async function updateDraft(
	id: string,
	input: UpdateDraftInput,
): Promise<DraftChangeNode | null> {
	await ensureReady();
	const existing = await getDraft(id);
	if (!existing) return null;
	if (existing.status !== "draft" && existing.status !== "rejected") {
		throw new Error("Cannot edit draft after submission");
	}

	const updatedAt = nowIso();
	const props: DraftProps = {
		...existing,
		title: input.title?.trim() ?? existing.title,
		summary: input.summary?.trim() ?? existing.summary,
		changeKind: input.changeKind ?? existing.changeKind,
		repoPath: input.repoPath ?? existing.repoPath,
		slug: input.slug ?? existing.slug,
		pathClass: input.pathClass ?? existing.pathClass,
		specLevel: input.specLevel ?? existing.specLevel,
		frontmatterJson: input.frontmatterJson ?? existing.frontmatterJson,
		bodyMd: input.bodyMd ?? existing.bodyMd,
		layoutJson:
			input.layoutJson !== undefined ? input.layoutJson : existing.layoutJson,
		status: existing.status === "rejected" ? "draft" : existing.status,
		rejectReason: existing.status === "rejected" ? null : existing.rejectReason,
		updatedAt,
	};

	await runWrite(
		`MATCH (d:DraftChange {id: $id}) SET d += $props`,
		{ id, props },
	);
	return props;
}

export async function deleteDraft(id: string): Promise<boolean> {
	await ensureReady();
	const existing = await getDraft(id);
	if (!existing) return false;
	if (existing.status !== "draft" && existing.status !== "rejected") {
		throw new Error("Cannot delete draft after submission");
	}
	await runWrite(
		`MATCH (d:DraftChange {id: $id}) DETACH DELETE d`,
		{ id },
	);
	return true;
}

export async function listDraftsForUser(
	authorLogin: string,
): Promise<DraftChangeNode[]> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftProps }>(
		`
		MATCH (d:DraftChange {authorLogin: $authorLogin})
		RETURN properties(d) AS props
		ORDER BY d.updatedAt DESC
		`,
		{ authorLogin },
	);
	return rows.map(mapDraft);
}

export async function submitDraft(id: string): Promise<DraftChangeNode | null> {
	await ensureReady();
	const existing = await getDraft(id);
	if (!existing) return null;
	if (existing.status !== "draft" && existing.status !== "rejected") {
		throw new Error("Draft is not editable");
	}
	const updatedAt = nowIso();
	await runWrite(
		`MATCH (d:DraftChange {id: $id}) SET d.status = 'submitted', d.updatedAt = $updatedAt`,
		{ id, updatedAt },
	);
	return getDraft(id);
}

export async function listPendingReview(): Promise<DraftChangeNode[]> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftProps }>(
		`
		MATCH (d:DraftChange {status: 'submitted'})
		RETURN properties(d) AS props
		ORDER BY d.updatedAt ASC
		`,
	);
	return rows.map(mapDraft);
}

export async function approveDraft(
	id: string,
	moderatorLogin: string,
	updates: { headBranch?: string; prNumber?: number; prUrl?: string },
): Promise<DraftChangeNode | null> {
	await ensureReady();
	const existing = await getDraft(id);
	if (!existing) return null;
	if (existing.status !== "submitted") {
		throw new Error("Only submitted drafts can be approved");
	}
	const updatedAt = nowIso();
	const props: DraftProps = {
		...existing,
		status: "approved",
		moderatorLogin,
		updatedAt,
		headBranch: updates.headBranch ?? existing.headBranch,
		prNumber: updates.prNumber ?? existing.prNumber,
		prUrl: updates.prUrl ?? existing.prUrl,
	};

	await runWrite(
		`MATCH (d:DraftChange {id: $id}) SET d += $props`,
		{ id, props },
	);
	return props;
}

export async function rejectDraft(
	id: string,
	moderatorLogin: string,
	rejectReason: string,
): Promise<DraftChangeNode | null> {
	await ensureReady();
	const existing = await getDraft(id);
	if (!existing) return null;
	if (existing.status !== "submitted") {
		throw new Error("Only submitted drafts can be rejected");
	}
	const updatedAt = nowIso();
	const props: DraftProps = {
		...existing,
		status: "rejected",
		moderatorLogin,
		rejectReason: rejectReason.trim(),
		updatedAt,
	};

	await runWrite(
		`MATCH (d:DraftChange {id: $id}) SET d += $props`,
		{ id, props },
	);
	return props;
}

export async function markDraftMerged(
	id: string,
): Promise<DraftChangeNode | null> {
	await ensureReady();
	const existing = await getDraft(id);
	if (!existing) return null;
	const updatedAt = nowIso();
	await runWrite(
		`MATCH (d:DraftChange {id: $id}) SET d.status = 'merged', d.updatedAt = $updatedAt`,
		{ id, updatedAt },
	);
	return getDraft(id);
}

export async function findDraftByPrNumber(
	prNumber: number,
): Promise<DraftChangeNode | null> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftProps }>(
		`MATCH (d:DraftChange {prNumber: $prNumber}) RETURN properties(d) AS props LIMIT 1`,
		{ prNumber },
	);
	if (rows.length === 0) return null;
	return mapDraft(rows[0]);
}

export async function findDraftByHeadBranch(
	headBranch: string,
): Promise<DraftChangeNode | null> {
	await ensureReady();
	const rows = await runQuery<{ props: DraftProps }>(
		`MATCH (d:DraftChange {headBranch: $headBranch}) RETURN properties(d) AS props LIMIT 1`,
		{ headBranch },
	);
	if (rows.length === 0) return null;
	return mapDraft(rows[0]);
}

export async function setDraftPrInfo(
	id: string,
	info: { headBranch: string; prNumber: number; prUrl: string },
): Promise<DraftChangeNode | null> {
	await ensureReady();
	const updatedAt = nowIso();
	await runWrite(
		`
		MATCH (d:DraftChange {id: $id})
		SET d.headBranch = $headBranch, d.prNumber = $prNumber, d.prUrl = $prUrl, d.updatedAt = $updatedAt
		`,
		{ id, ...info, updatedAt },
	);
	return getDraft(id);
}

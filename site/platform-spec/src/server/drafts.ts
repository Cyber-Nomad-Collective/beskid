import { createServerFn } from "@tanstack/react-start";
import { requireMaintainer, withAuthUser } from "#/server/auth-guard.server";
import { createDraftPullRequest } from "#/server/git-sync/pr";
import {
	approveDraft,
	createDraft,
	deleteDraft,
	getDraft,
	listDraftsForUser,
	listPendingReview,
	rejectDraft,
	submitDraft,
	updateDraft,
} from "#/server/memgraph/drafts";
import type {
	DraftChangeKind,
	DraftChangeNode,
	SpecLevel,
} from "#/server/memgraph/types";

function normalizeCapability(value: string): string {
	const capability = value
		.trim()
		.replace(/^platform-spec\/capabilities\//, "")
		.replace(/^\/+|\/+$/g, "")
		.replace(/[^a-z0-9-]+/gi, "--")
		.toLowerCase();
	if (
		!capability ||
		!/^[a-z0-9]+(?:-+[a-z0-9]+)*(?:--[a-z0-9]+(?:-+[a-z0-9]+)*)+$/.test(
			capability,
		)
	) {
		throw new Error(
			"Capability must use OpenSpec segments such as language--syntax--blocks",
		);
	}
	return capability;
}

export const listMyDraftsFn = createServerFn({ method: "GET" }).handler(
	async () => withAuthUser(async ({ login }) => listDraftsForUser(login)),
);

export const getDraftFn = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const draft = await getDraft(data.id);
			if (!draft) throw new Error("Draft not found");
			if (draft.authorLogin !== login) {
				throw new Error("Forbidden");
			}
			return draft;
		}),
	);

export const createDraftFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			title: string;
			summary?: string;
			changeKind: DraftChangeKind;
			specLevel: SpecLevel;
			values: Record<string, string>;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const capability = normalizeCapability(data.values.capability ?? "");
			const repoPath = `openspec/specs/${capability}/spec.md`;
			const slug = `platform-spec/capabilities/${capability}`;
			const bodyMd = data.values.body_md ?? "";

			const id = crypto.randomUUID();
			return createDraft({
				id,
				title: data.title.trim(),
				summary: data.summary?.trim(),
				changeKind: data.changeKind,
				repoPath,
				slug,
				pathClass: "feature",
				specLevel: "feature",
				frontmatterJson: "{}",
				bodyMd,
				layoutJson: null,
				authorLogin: login,
			});
		}),
	);

export const updateDraftFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			title?: string;
			summary?: string;
			changeKind?: DraftChangeKind;
			specLevel?: SpecLevel;
			values?: Record<string, string>;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraft(data.id);
			if (!existing) throw new Error("Draft not found");
			if (existing.authorLogin !== login) {
				throw new Error("Forbidden");
			}

			let repoPath = existing.repoPath;
			let bodyMd = existing.bodyMd;
			let slug = existing.slug;

			if (data.values) {
				const capability = normalizeCapability(data.values.capability ?? slug);
				repoPath = `openspec/specs/${capability}/spec.md`;
				slug = `platform-spec/capabilities/${capability}`;
				bodyMd = data.values.body_md ?? bodyMd;
			}

			return updateDraft(data.id, {
				title: data.title,
				summary: data.summary,
				changeKind: data.changeKind,
				repoPath,
				slug,
				pathClass: "feature",
				specLevel: "feature",
				frontmatterJson: "{}",
				bodyMd,
				layoutJson: null,
			});
		}),
	);

export const deleteDraftFn = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraft(data.id);
			if (!existing) throw new Error("Draft not found");
			if (existing.authorLogin !== login) {
				throw new Error("Forbidden");
			}
			await deleteDraft(data.id);
			return { ok: true };
		}),
	);

export const submitDraftFn = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraft(data.id);
			if (!existing) throw new Error("Draft not found");
			if (existing.authorLogin !== login) {
				throw new Error("Forbidden");
			}
			const draft = await submitDraft(data.id);
			if (!draft) throw new Error("Draft not found");
			return draft;
		}),
	);

export const listPendingReviewFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireMaintainer();
		return listPendingReview();
	},
);

export const approveDraftFn = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login, octokit }) => {
			await requireMaintainer();
			const draft = await getDraft(data.id);
			if (!draft) throw new Error("Draft not found");
			if (draft.status !== "submitted") {
				throw new Error("Draft is not awaiting review");
			}

			const pr = await createDraftPullRequest(octokit, draft);
			return approveDraft(data.id, login, {
				headBranch: pr.branch,
				prNumber: pr.prNumber,
				prUrl: pr.prUrl,
			});
		}),
	);

export const rejectDraftFn = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string; reason: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			await requireMaintainer();
			const draft = await rejectDraft(
				data.id,
				login,
				data.reason || "Rejected by moderator",
			);
			if (!draft) throw new Error("Draft not found");
			return draft;
		}),
	);

export type { DraftChangeNode };

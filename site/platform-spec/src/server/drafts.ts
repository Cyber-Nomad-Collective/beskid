import {
	buildRepoPathFromForm,
	buildSlugFromRepoPath,
} from "@cyber-nomad-collective/trudoc/platform-spec/docs-spec";
import {
	formValuesToFrontmatter,
	frontmatterToFormValues,
} from "@cyber-nomad-collective/trudoc/platform-spec/docs-spec";
import {
	parseFrontmatterJson,
	validateFrontmatterForLevel,
} from "@cyber-nomad-collective/trudoc/platform-spec/docs-spec";
import {
	pathClassFromRepoPath,
	validateSpecLevelPath,
} from "@cyber-nomad-collective/trudoc/platform-spec/docs-spec";
import { createServerFn } from "@tanstack/react-start";

import type {
	DraftChangeKind,
	DraftChangeNode,
	SpecLevel,
} from "#/server/memgraph/types";
import { withAuthUser, requireMaintainer } from "#/server/auth-guard.server";
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
import { exportApprovedDraft } from "#/server/git-sync/export";
import { createDraftPullRequest } from "#/server/git-sync/pr";

export const listMyDraftsFn = createServerFn({ method: "GET" }).handler(
	async () =>
		withAuthUser(async ({ login }) => listDraftsForUser(login)),
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
			let repoPath: string;
			if (data.changeKind === "create") {
				repoPath = buildRepoPathFromForm(
					data.specLevel,
					data.values.parent_slug ?? "platform-spec",
					data.values.leaf_slug ?? "new-doc",
				);
			} else {
				repoPath =
					data.values.repo_path?.trim() ||
					buildRepoPathFromForm(
						data.specLevel,
						data.values.parent_slug ?? "platform-spec",
						data.values.leaf_slug ?? "new-doc",
					);
			}

			const pathError = validateSpecLevelPath(data.specLevel, repoPath);
			if (pathError) throw new Error(pathError);

			const frontmatter = formValuesToFrontmatter(
				data.specLevel,
				data.values,
			);
			const fmCheck = validateFrontmatterForLevel(
				data.specLevel,
				frontmatter,
			);
			if (!fmCheck.ok) {
				throw new Error(fmCheck.errors.join("; "));
			}

			const slug = buildSlugFromRepoPath(repoPath);
			const pathClass = pathClassFromRepoPath(repoPath);
			const bodyMd = data.values.body_md ?? "";
			let layoutJson: string | null = data.values.layout_json?.trim()
				? data.values.layout_json
				: null;
			if (!layoutJson && data.values.layout_preset?.trim()) {
				layoutJson = JSON.stringify({
					version: 1,
					level: data.specLevel,
					extends: data.values.layout_preset.trim(),
				});
			}

			const id = crypto.randomUUID();
			return createDraft({
				id,
				title: data.title.trim(),
				summary: data.summary?.trim(),
				changeKind: data.changeKind,
				repoPath,
				slug,
				pathClass,
				specLevel: data.specLevel,
				frontmatterJson: JSON.stringify(frontmatter),
				bodyMd,
				layoutJson,
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
			let frontmatterJson = existing.frontmatterJson;
			let bodyMd = existing.bodyMd;
			let layoutJson = existing.layoutJson;
			let slug = existing.slug;
			let pathClass = existing.pathClass;
			let specLevel = existing.specLevel;

			if (data.values && data.specLevel) {
				if (data.changeKind === "create" || !data.changeKind) {
					repoPath = buildRepoPathFromForm(
						data.specLevel,
						data.values.parent_slug ?? "platform-spec",
						data.values.leaf_slug ?? "new-doc",
					);
				} else if (data.values.repo_path?.trim()) {
					repoPath = data.values.repo_path.trim();
				}

				const pathError = validateSpecLevelPath(data.specLevel, repoPath);
				if (pathError) throw new Error(pathError);

				const frontmatter = formValuesToFrontmatter(
					data.specLevel,
					data.values,
				);
				const fmCheck = validateFrontmatterForLevel(
					data.specLevel,
					frontmatter,
				);
				if (!fmCheck.ok) {
					throw new Error(fmCheck.errors.join("; "));
				}

				frontmatterJson = JSON.stringify(frontmatter);
				bodyMd = data.values.body_md ?? bodyMd;
				layoutJson = data.values.layout_json?.trim()
					? data.values.layout_json
					: layoutJson;
				slug = buildSlugFromRepoPath(repoPath);
				pathClass = pathClassFromRepoPath(repoPath);
				specLevel = data.specLevel;
			}

			return updateDraft(data.id, {
				title: data.title,
				summary: data.summary,
				changeKind: data.changeKind,
				repoPath,
				slug,
				pathClass,
				specLevel,
				frontmatterJson,
				bodyMd,
				layoutJson,
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

			exportApprovedDraft(draft);
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

export { frontmatterToFormValues };
export type { DraftChangeNode };

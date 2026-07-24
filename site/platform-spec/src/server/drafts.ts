import { createServerFn } from "@tanstack/react-start";

import type {
	SpecArtifactKind,
	SpecDocumentIdentityInput,
} from "#/lib/spec/document-identity";
import { resolveDocumentIdentity } from "#/lib/spec/document-identity";
import {
	layoutTemplateMarkdown,
	validateDraftContext,
} from "#/lib/spec/draft-validation";
import { loadLayoutRegistry, resolveLayout } from "#/lib/spec/layouts";
import { requireMaintainer, withAuthUser } from "#/server/auth-guard.server";
import { createDraftPullRequest } from "#/server/git-sync/pr";
import {
	addDraftDocument,
	approveDraftContext,
	createDraftContext,
	deleteDraftContext,
	getDraftContext,
	hashMarkdown,
	listDraftContextsForUser,
	listPendingDraftContexts,
	migrateLegacyDraftChanges,
	rejectDraftContext,
	removeDraftDocument,
	submitDraftContext,
	updateDraftContextMeta,
	updateDraftDocument,
} from "#/server/memgraph/draft-contexts";
import type {
	DraftDocumentOperation,
	ParsedDraftContextBundle,
} from "#/server/memgraph/types";
import {
	getOpenSpecDocument,
	loadOpenSpecCatalog,
	resolveOpenSpecRoot,
} from "#/server/openspec/reader";

function catalogPaths() {
	const catalog = loadOpenSpecCatalog();
	return {
		revision: catalog.revision,
		paths: new Set(catalog.documents.map((doc) => doc.canonicalPath)),
		slugs: new Set(catalog.documents.map((doc) => doc.slug)),
		catalog,
	};
}

function layouts() {
	return loadLayoutRegistry(resolveOpenSpecRoot());
}

function assertOwner(
	bundle: ParsedDraftContextBundle,
	login: string,
): void {
	if (bundle.context.authorLogin !== login) {
		throw new Error("Forbidden");
	}
}

function revalidateBundle(bundle: ParsedDraftContextBundle) {
	const catalog = catalogPaths();
	return validateDraftContext(
		bundle.documentChanges,
		catalog,
		layouts(),
		bundle.context.baseCatalogRevision,
	);
}

export const listMyDraftsFn = createServerFn({ method: "GET" }).handler(
	async () =>
		withAuthUser(async ({ login }) => {
			await migrateLegacyDraftChanges();
			return listDraftContextsForUser(login);
		}),
);

export const getDraftFn = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const draft = await getDraftContext(data.id);
			if (!draft) throw new Error("Draft not found");
			assertOwner(draft, login);
			return draft;
		}),
	);

export const createDraftContextFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			title: string;
			summary?: string;
			trackerTaskIds?: string[];
			deliveryVersionId?: string | null;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const catalog = catalogPaths();
			return createDraftContext({
				id: crypto.randomUUID(),
				title: data.title.trim(),
				summary: data.summary?.trim(),
				baseCatalogRevision: catalog.revision,
				authorLogin: login,
				trackerTaskIds: data.trackerTaskIds,
				deliveryVersionId: data.deliveryVersionId,
			});
		}),
	);

export const resolveDraftIdentityFn = createServerFn({ method: "POST" })
	.inputValidator((data: { identity: SpecDocumentIdentityInput }) => data)
	.handler(async ({ data }) => {
		const identity = resolveDocumentIdentity(data.identity);
		const registry = layouts();
		const layout = registry
			? resolveLayout(identity.specLevel, registry)
			: null;
		return {
			identity,
			layoutId: layout?.id ?? identity.layout,
			templateMarkdown: layout ? layoutTemplateMarkdown(layout) : "",
		};
	});

export const addDraftDocumentFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			contextId: string;
			operation: DraftDocumentOperation;
			identity: SpecDocumentIdentityInput;
			sourceMarkdown?: string;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraftContext(data.contextId);
			if (!existing) throw new Error("Draft not found");
			assertOwner(existing, login);

			const identity = resolveDocumentIdentity(data.identity);
			const registry = layouts();
			const layout = registry
				? resolveLayout(identity.specLevel, registry)
				: null;
			const layoutId = layout?.id ?? identity.layout;

			let baseMarkdown: string | null = null;
			let baseContentHash: string | null = null;
			if (data.operation === "update" || data.operation === "delete") {
				const doc = getOpenSpecDocument(identity.key) ?? getOpenSpecDocument(identity.publicSlug);
				if (!doc) {
					throw new Error(`Base document not found for ${identity.key}`);
				}
				baseMarkdown = doc.body;
				baseContentHash = hashMarkdown(doc.body);
			}

			const sourceMarkdown =
				data.sourceMarkdown ??
				(data.operation === "delete"
					? baseMarkdown ?? ""
					: layout
						? layoutTemplateMarkdown(layout)
						: "");

			return addDraftDocument({
				contextId: data.contextId,
				operation: data.operation,
				identity,
				sourceMarkdown,
				baseMarkdown,
				baseContentHash,
				layoutId,
				actorLogin: login,
			});
		}),
	);

export const updateDraftDocumentFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			contextId: string;
			documentChangeId: string;
			sourceMarkdown?: string;
			operation?: DraftDocumentOperation;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraftContext(data.contextId);
			if (!existing) throw new Error("Draft not found");
			assertOwner(existing, login);
			return updateDraftDocument({
				contextId: data.contextId,
				documentChangeId: data.documentChangeId,
				sourceMarkdown: data.sourceMarkdown,
				operation: data.operation,
				actorLogin: login,
			});
		}),
	);

export const removeDraftDocumentFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { contextId: string; documentChangeId: string }) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraftContext(data.contextId);
			if (!existing) throw new Error("Draft not found");
			assertOwner(existing, login);
			return removeDraftDocument(
				data.contextId,
				data.documentChangeId,
				login,
			);
		}),
	);

export const updateDraftContextFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			title?: string;
			summary?: string;
			trackerTaskIds?: string[];
			deliveryVersionId?: string | null;
			rebaseToCurrentCatalog?: boolean;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraftContext(data.id);
			if (!existing) throw new Error("Draft not found");
			assertOwner(existing, login);
			const catalog = catalogPaths();
			return updateDraftContextMeta(
				data.id,
				{
					title: data.title,
					summary: data.summary,
					trackerTaskIds: data.trackerTaskIds,
					deliveryVersionId: data.deliveryVersionId,
					baseCatalogRevision: data.rebaseToCurrentCatalog
						? catalog.revision
						: undefined,
				},
				login,
			);
		}),
	);

export const deleteDraftFn = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraftContext(data.id);
			if (!existing) throw new Error("Draft not found");
			assertOwner(existing, login);
			await deleteDraftContext(data.id);
			return { ok: true };
		}),
	);

export const submitDraftFn = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const existing = await getDraftContext(data.id);
			if (!existing) throw new Error("Draft not found");
			assertOwner(existing, login);
			const catalog = catalogPaths();
			const validation = revalidateBundle(existing);
			if (!validation.ok) {
				throw new Error("validation");
			}
			return submitDraftContext(data.id, "valid", catalog.revision);
		}),
	);

export const listPendingReviewFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireMaintainer();
		await migrateLegacyDraftChanges();
		return listPendingDraftContexts();
	},
);

export const approveDraftFn = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login, octokit }) => {
			await requireMaintainer();
			const draft = await getDraftContext(data.id);
			if (!draft) throw new Error("Draft not found");
			if (draft.context.status !== "submitted") {
				throw new Error("Draft is not awaiting review");
			}
			const catalog = catalogPaths();
			if (draft.context.baseCatalogRevision !== catalog.revision) {
				throw new Error("stale-base-revision");
			}
			const validation = revalidateBundle(draft);
			if (!validation.ok) {
				throw new Error("validation");
			}
			const pr = await createDraftPullRequest(octokit, draft);
			return approveDraftContext(data.id, login, {
				headBranch: pr.branch,
				prNumber: pr.prNumber,
				prUrl: pr.prUrl,
			});
		}),
	);

export const rejectDraftFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			reason: string;
			documentNotes?: Array<{ documentChangeId: string; note: string }>;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			await requireMaintainer();
			const draft = await rejectDraftContext(
				data.id,
				login,
				data.reason || "Rejected by moderator",
				data.documentNotes,
			);
			return draft;
		}),
	);

/** @deprecated Compatibility alias — creates an empty context then one feature doc. */
export const createDraftFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			title: string;
			summary?: string;
			changeKind: DraftDocumentOperation;
			values: Record<string, string>;
			artifactKind?: SpecArtifactKind;
		}) => data,
	)
	.handler(async ({ data }) =>
		withAuthUser(async ({ login }) => {
			const catalog = catalogPaths();
			const context = await createDraftContext({
				id: crypto.randomUUID(),
				title: data.title.trim(),
				summary: data.summary?.trim(),
				baseCatalogRevision: catalog.revision,
				authorLogin: login,
			});
			const capability = (data.values.capability ?? "")
				.trim()
				.replace(/^platform-spec\/capabilities\//, "");
			const [domain, area, feature] = capability.split("--");
			if (!domain || !area || !feature) {
				throw new Error(
					"Capability must use OpenSpec segments such as language--syntax--blocks",
				);
			}
			return addDraftDocument({
				contextId: context.context.id,
				operation: data.changeKind,
				identity: resolveDocumentIdentity({
					kind: "feature",
					domain,
					area,
					feature,
				}),
				sourceMarkdown: data.values.body_md ?? "",
				layoutId: "feature",
				actorLogin: login,
			});
		}),
	);

export type { ParsedDraftContextBundle };

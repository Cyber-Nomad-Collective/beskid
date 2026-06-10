import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { NormativeRepoSettingsPanel } from "@beskid/ui-react/platform-spec";

import {
	approveDraftFn,
	listPendingReviewFn,
	rejectDraftFn,
} from "#/server/drafts";
import {
	fetchNormativeRepoSettingsFn,
	updateNormativeRepoSettingsFn,
} from "#/server/normative-repo-settings";
import {
	canConfigureNormativeRepo,
	canModerateSpec,
} from "#/lib/github/permissions";
import { requireSession, withOctokit } from "#/server/auth-guard.server";

export const Route = createFileRoute("/_edit/moderation/")({
	loader: async () => {
		const session = await requireSession();
		const [canEdit, canModerate, repoSettings] = await Promise.all([
			withOctokit((octokit) => canConfigureNormativeRepo(octokit, session.login)),
			withOctokit((octokit) => canModerateSpec(octokit, session.login)),
			fetchNormativeRepoSettingsFn(),
		]);

		if (!canEdit && !canModerate) {
			throw redirect({ to: "/edit" });
		}

		const queue = canModerate ? await listPendingReviewFn() : [];

		return { queue, repoSettings, canEdit, canModerate };
	},
	component: ModerationPage,
});

function ModerationPage() {
	const router = useRouter();
	const { queue, repoSettings, canEdit, canModerate } = Route.useLoaderData();
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function onApprove(id: string) {
		setBusyId(id);
		setError(null);
		try {
			await approveDraftFn({ data: { id } });
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Approve failed");
		} finally {
			setBusyId(null);
		}
	}

	async function onReject(id: string) {
		const reason = prompt("Rejection reason")?.trim();
		if (!reason) return;
		setBusyId(id);
		setError(null);
		try {
			await rejectDraftFn({ data: { id, reason } });
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Reject failed");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">
					{canModerate ? "Moderation" : "Spec repository settings"}
				</h1>
				<Link to="/edit" className="text-sm underline">
					← My drafts
				</Link>
			</div>

			{error ? (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			) : null}

			<NormativeRepoSettingsPanel
				initialRepoUrl={repoSettings.repoUrl}
				defaultRepoUrl={repoSettings.defaultRepoUrl}
				source={repoSettings.source}
				canEdit={canEdit}
				onSave={async (repoUrl) => {
					await updateNormativeRepoSettingsFn({ data: { repoUrl } });
					await router.invalidate();
				}}
			/>

			{canModerate ? (
				queue.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No drafts awaiting review.
					</p>
				) : (
					<ul className="divide-y rounded-lg border">
						{queue.map((draft) => (
							<li key={draft.id} className="space-y-3 px-4 py-4">
								<div className="flex items-start justify-between gap-4">
									<div>
										<h2 className="font-medium">{draft.title}</h2>
										<p className="text-xs text-muted-foreground">
											@{draft.authorLogin} · {draft.slug} · {draft.changeKind}
										</p>
										{draft.summary ? (
											<p className="mt-2 text-sm">{draft.summary}</p>
										) : null}
									</div>
									<div className="flex shrink-0 gap-2">
										<button
											type="button"
											className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
											disabled={busyId === draft.id}
											onClick={() => void onApprove(draft.id)}
										>
											Approve & open PR
										</button>
										<button
											type="button"
											className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
											disabled={busyId === draft.id}
											onClick={() => void onReject(draft.id)}
										>
											Reject
										</button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)
			) : null}
		</div>
	);
}

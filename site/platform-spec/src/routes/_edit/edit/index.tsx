import { Link, createFileRoute } from "@tanstack/react-router";

import { listMyDraftsFn } from "#/server/drafts";

export const Route = createFileRoute("/_edit/edit/")({
	loader: async () => ({ drafts: await listMyDraftsFn() }),
	component: DraftsListPage,
});

function statusLabel(status: string): string {
	return status.replace(/_/g, " ");
}

function DraftsListPage() {
	const { drafts } = Route.useLoaderData();

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">My drafts</h1>
				<Link
					to="/edit/drafts/$id"
					params={{ id: "new" }}
					className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
				>
					New draft
				</Link>
			</div>

			{drafts.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No drafts yet. Create one to propose platform-spec changes.
				</p>
			) : (
				<ul className="divide-y rounded-lg border">
					{drafts.map((draft) => (
						<li key={draft.id} className="flex items-center justify-between px-4 py-3">
							<div>
								<Link
									to="/edit/drafts/$id"
									params={{ id: draft.id }}
									className="font-medium hover:underline"
								>
									{draft.title}
								</Link>
								<p className="text-xs text-muted-foreground">
									{draft.slug} · {statusLabel(draft.status)}
								</p>
							</div>
							<span className="text-xs text-muted-foreground">
								{new Date(draft.updatedAt).toLocaleString()}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

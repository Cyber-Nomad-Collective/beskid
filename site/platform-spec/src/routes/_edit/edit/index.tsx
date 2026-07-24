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
				<h1 className="text-2xl font-semibold">My draft contexts</h1>
				<Link
					to="/edit/drafts/$id"
					params={{ id: "new" }}
					search={{} as never}
				className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
				>
					New context
				</Link>
			</div>

			{drafts.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No draft contexts yet. Create one to propose OpenSpec document changes.
				</p>
			) : (
				<ul className="divide-y rounded-lg border">
					{drafts.map((draft) => (
						<li
							key={draft.id}
							className="flex items-center justify-between px-4 py-3"
						>
							<div>
								<Link
									to="/edit/drafts/$id"
									params={{ id: draft.id }}
									search={{} as never}
								className="font-medium hover:underline"
							>
									{draft.title}
								</Link>
								<p className="text-xs text-muted-foreground">
									rev {draft.baseCatalogRevision} · {statusLabel(draft.status)}
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

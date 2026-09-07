import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { GitHubRateLimitAlert } from "#/components/github-rate-limit-alert";
import { PublicBugList } from "#/components/public-bug-list";
import { ReportIssueDialog } from "#/components/report-issue-dialog";
import { RoadmapReactFilterBar } from "#/components/roadmap-react-filter-bar";
import { filterBugsByMetaQuery } from "#/lib/roadmap/meta-search";
import { getAuthUser } from "#/server/auth";
import { listPublicBugsFn } from "#/server/public-bugs";

const bugsSearchSchema = z.object({
	q: z.string().optional(),
});

export const Route = createFileRoute("/_shell/bugs")({
	validateSearch: bugsSearchSchema,
	loader: async () => {
		const [bugs, user] = await Promise.all([listPublicBugsFn(), getAuthUser()]);
		return { bugPayload: bugs, user };
	},
	component: BugTrackerPage,
});

function BugTrackerPage() {
	const { bugPayload, user: loaderUser } = Route.useLoaderData();
	const { authUser } = Route.useRouteContext();
	const user = loaderUser ?? authUser;
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [query, setQuery] = useState(search.q ?? "");

	useEffect(() => {
		setQuery(search.q ?? "");
	}, [search.q]);

	const filteredBugs = useMemo(
		() => filterBugsByMetaQuery(bugPayload.bugs, query),
		[bugPayload.bugs, query],
	);

	const syncQuery = (next: string) => {
		setQuery(next);
		navigate({ search: { q: next || undefined }, replace: true });
	};

	return (
		<main className="page-wrap flex min-h-0 flex-1 flex-col gap-6 py-8">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="island-kicker">Beskid Tracker</p>
					<h1 className="display-title mt-1 text-xl font-bold md:text-2xl">
						Open bugs
					</h1>
					<p className="text-muted-foreground mt-2 max-w-2xl text-sm">
						Public issues on the superrepo labeled{" "}
						<code className="text-xs">bug</code>. Search by title, author, labels, or{" "}
						<code className="text-xs">#number</code>.
					</p>
				</div>
				<ReportIssueDialog user={user} />
			</header>

			<RoadmapReactFilterBar
				value={query}
				onChange={syncQuery}
				showStructuredFilters={false}
				resultCount={filteredBugs.length}
				totalCount={bugPayload.bugs.length}
			/>

			{bugPayload.rateLimited ? (
				<GitHubRateLimitAlert message={bugPayload.message} />
			) : null}

			<PublicBugList
				bugs={filteredBugs}
				user={user}
				catalogCount={bugPayload.bugs.length}
				rateLimited={bugPayload.rateLimited}
			/>
		</main>
	);
}

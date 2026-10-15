import { buttonVariants } from "@cyber-nomad-collective/beskid-ui-react";
import { MessageSquare } from "lucide-react";
import { formatDateTime } from "#/lib/format";
import type { PackageCommunity, PackageCommunityStatus } from "#/lib/pckg-api";

/**
 * Link to the package's discussion thread (NodeBB topic) on the community
 * site.
 *
 * The registry owns the link: it opened the thread on NodeBB when the package
 * was made public and returns its public URL. Nothing is guessed on the
 * client, so a package without a linked thread shows no button rather than a
 * dead link. Live counters and the newest posts come from
 * `GET /api/packages/{name}/community`, fetched and cached server-side (the
 * browser never calls NodeBB), and are optional.
 */
export function CommunityLink({
	packageName,
	community,
	status,
}: {
	packageName: string;
	community: PackageCommunity | null;
	status?: PackageCommunityStatus | null;
}) {
	if (!community) return null;
	const counters = formatCounters(status);
	return (
		<a
			className={buttonVariants({ variant: "outline" })}
			href={community.url}
			target="_blank"
			rel="noopener noreferrer"
			title={`Open the ${packageName} thread on community.beskid-lang.org`}
		>
			<MessageSquare />
			Discuss on the forum
			{counters && <span className="text-muted-foreground">· {counters}</span>}
		</a>
	);
}

/** Newest forum posts of the package thread, rendered under the hero. */
export function CommunityRecentPosts({
	status,
}: {
	status?: PackageCommunityStatus | null;
}) {
	if (!status || status.recentPosts.length === 0) return null;
	return (
		<section
			className="mt-6 rounded-md border border-border p-4"
			aria-label="Recent forum posts"
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">Recent forum posts</h2>
				<a
					className="text-sm text-primary underline"
					href={status.url}
					target="_blank"
					rel="noopener noreferrer"
				>
					Open the thread
				</a>
			</div>
			<ul className="mt-3 space-y-3">
				{status.recentPosts.map((post) => (
					<li key={post.pid} className="text-sm">
						<p className="text-xs text-muted-foreground">
							<span className="font-medium text-foreground">{post.author}</span>
							{" · "}
							<a
								href={post.url}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								<time dateTime={post.postedAtUtc}>
									{formatDateTime(post.postedAtUtc)}
								</time>
							</a>
						</p>
						<p className="mt-1">{post.excerpt}</p>
					</li>
				))}
			</ul>
		</section>
	);
}

export function formatCounters(
	status: PackageCommunityStatus | null | undefined,
): string | null {
	if (!status || status.replyCount === null || status.viewCount === null)
		return null;
	const replies = `${status.replyCount} ${status.replyCount === 1 ? "reply" : "replies"}`;
	const views = `${status.viewCount} ${status.viewCount === 1 ? "view" : "views"}`;
	return `${replies}, ${views}`;
}

import { buttonVariants } from "@cyber-nomad-collective/beskid-ui-react";
import { MessageSquare } from "lucide-react";
import type { PackageCommunity, PackageCommunityStatus } from "#/lib/pckg-api";

/**
 * Link to the package's NodeBB discussion category on the community site.
 *
 * The registry owns the link: it created the category on NodeBB when the
 * package was made public and returns its public URL. Nothing is guessed on
 * the client, so a package without a linked category shows no button rather
 * than a dead link. Live counters come from `GET /api/packages/{name}/community`
 * and are optional (NodeBB may be unreachable).
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
			title={`Open the ${packageName} discussion on community.beskid-lang.org`}
		>
			<MessageSquare />
			Discuss {packageName}
			{counters && <span className="text-muted-foreground">· {counters}</span>}
		</a>
	);
}

export function formatCounters(
	status: PackageCommunityStatus | null | undefined,
): string | null {
	if (!status || status.topicCount === null || status.postCount === null)
		return null;
	const topics = `${status.topicCount} ${status.topicCount === 1 ? "topic" : "topics"}`;
	const posts = `${status.postCount} ${status.postCount === 1 ? "post" : "posts"}`;
	return `${topics}, ${posts}`;
}

import { Button } from "@cyber-nomad-collective/beskid-ui-react";
import { MessageSquare } from "lucide-react";

/**
 * Deep-link to a package's locked NodeBB subforum on the community site.
 *
 * The URL is public (community.beskid-lang.org/category/<slug>); the admin
 * token used to create the subforum is never exposed here.
 */
export function NodebbLink({
	packageName,
	slug,
}: {
	packageName: string;
	slug?: string;
}) {
	if (!slug) return null;
	const href = `https://community.beskid-lang.org/category/${slug}`;
	return (
		<Button asChild variant="outline" size="sm">
			<a href={href} target="_blank" rel="noopener noreferrer">
				<MessageSquare />
				Discuss {packageName}
			</a>
		</Button>
	);
}

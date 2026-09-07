import { ExternalLink } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import type { SpecLink } from "#/lib/platform-spec/parse";

interface SpecLinkChipsProps {
	links: SpecLink[];
}

export function SpecLinkChips({ links }: SpecLinkChipsProps) {
	if (links.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1.5">
			{links.map((link) => (
				<Badge
					key={link.path}
					variant="outline"
					className="max-w-full truncate font-normal"
				>
					<a
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex max-w-[14rem] items-center gap-1 truncate"
						title={link.path}
					>
						<span className="truncate">
							{link.title ?? link.path.split("/").at(-1) ?? link.path}
						</span>
						<ExternalLink className="size-3 shrink-0" />
					</a>
				</Badge>
			))}
		</div>
	);
}

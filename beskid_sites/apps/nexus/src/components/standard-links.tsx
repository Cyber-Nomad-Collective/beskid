export interface StandardLink {
	type?: "spec" | "book" | "nexus" | "bug";
	stableId?: string;
	title: string;
	href: string;
	revision?: string;
}

export interface StandardLinksProps {
	links: StandardLink[];
}

export function StandardLinks({ links }: StandardLinksProps) {
	return (
		<ul className="space-y-2" aria-label="Related standard requirements">
			{links.map((link) => (
				<li key={`${link.stableId ?? link.href}:${link.revision ?? ""}`}>
					<a
						href={link.href}
						className="block rounded-md border border-border/60 px-3 py-2 text-sm text-primary underline-offset-2 hover:bg-muted/40 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
						data-standard-link={link.type ?? "spec"}
						data-standard-id={link.stableId}
						data-standard-revision={link.revision}
					>
						<span className="block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
							{link.type ?? "spec"}
						</span>
						<span>{link.title}</span>
						{link.stableId ? (
							<code className="mt-1 block truncate text-[10px] text-muted-foreground">
								{link.stableId}
							</code>
						) : null}
					</a>
				</li>
			))}
		</ul>
	);
}

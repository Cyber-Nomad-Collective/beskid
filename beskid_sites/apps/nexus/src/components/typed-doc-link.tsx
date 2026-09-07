export type TypedDocLinkKind = "spec" | "book" | "nexus" | "bug";

export interface TypedDocLink {
	kind: TypedDocLinkKind;
	ref: string;
	title: string;
}

function fields(body: string): Record<string, string> {
	return Object.fromEntries(
		body
			.split("\n")
			.map((line) => line.match(/^([A-Za-z][\w-]*):\s*(.+)$/))
			.filter((match): match is RegExpMatchArray => match != null)
			.map((match) => [match[1]!, match[2]?.trim()]),
	);
}

export function parseTypedDocLink(
	kind: string,
	body: string,
): TypedDocLink | null {
	if (!["spec", "book", "nexus", "bug"].includes(kind)) return null;
	const values = fields(body);
	const ref = values.ref ?? values.id ?? values.slug;
	if (!ref) return null;
	return {
		kind: kind as TypedDocLinkKind,
		ref,
		title: values.title ?? values.label ?? ref,
	};
}

export function typedDocHref(link: TypedDocLink): string {
	if (link.kind === "spec") {
		const [capability, requirement] = link.ref.split("#", 2);
		return `https://spec.beskid-lang.org/platform-spec/${encodeURIComponent(capability!)}/${requirement ? `#${encodeURIComponent(requirement)}` : ""}`;
	}
	if (link.kind === "book")
		return `https://beskid-lang.org/book/${link.ref.replace(/^\/+|\/+$/g, "")}/`;
	if (link.kind === "nexus")
		return `https://nexus.beskid-lang.org/${link.ref.replace(/^\/+/, "")}`;
	return `https://tracker.beskid-lang.org/bugs/${encodeURIComponent(link.ref)}`;
}

export function TypedDocLinkCard({ link }: { link: TypedDocLink }) {
	return (
		<a
			href={typedDocHref(link)}
			target="_blank"
			rel="noopener noreferrer"
			className="my-2 block rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-primary no-underline hover:bg-primary/10"
			data-doc-link={link.kind}
			data-doc-ref={link.ref}
		>
			<span className="block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
				{link.kind}
			</span>
			<span className="text-sm font-medium">{link.title}</span>
			<code className="mt-1 block text-[10px] text-muted-foreground">
				{link.ref}
			</code>
		</a>
	);
}

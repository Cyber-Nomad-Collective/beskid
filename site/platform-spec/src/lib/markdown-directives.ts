export type BeskidDirectiveKind =
	| "spec"
	| "book"
	| "nexus"
	| "bug"
	| "code"
	| "graph"
	| "quote";

export interface BeskidMarkdownDirective {
	kind: BeskidDirectiveKind;
	ref: string;
	title: string;
}

const DIRECTIVE_FENCE =
	/^```(spec|book|nexus|bug|code|graph|quote)\s*\n([\s\S]*?)^```\s*$/gm;

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function fields(body: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of body.split("\n")) {
		const match = line.match(/^([a-zA-Z][\w-]*):\s*(.+)$/);
		if (match) result[match[1]] = match[2].trim();
	}
	return result;
}

export function parseBeskidDirective(
	kind: string,
	body: string,
): BeskidMarkdownDirective | null {
	if (!["spec", "book", "nexus", "bug", "code", "graph", "quote"].includes(kind))
		return null;
	const values = fields(body);
	const ref = values.ref ?? values.id ?? values.slug;
	if (!ref) return null;
	return {
		kind: kind as BeskidDirectiveKind,
		ref,
		title: values.title ?? values.label ?? ref,
	};
}

export function directiveHref(directive: BeskidMarkdownDirective): string {
	if (directive.kind === "spec") {
		const [capability] = directive.ref.split("#", 1);
		return `/platform-spec/capabilities/${encodeURIComponent(capability)}/`;
	}
	if (directive.kind === "book") {
		return `https://beskid-lang.org/book/${directive.ref.replace(/^\/+|\/+$/g, "")}/`;
	}
	if (directive.kind === "nexus") {
		return `https://nexus.beskid-lang.org/${directive.ref.replace(/^\/+/, "")}`;
	}
	if (directive.kind === "code") {
		const [lang] = directive.ref.split(":", 2);
		return `#spec-code-${encodeURIComponent(lang ?? "text")}`;
	}
	if (directive.kind === "graph") {
		return `#spec-graph-${encodeURIComponent(directive.ref)}`;
	}
	if (directive.kind === "quote") {
		return `/platform-spec/capabilities/${encodeURIComponent(directive.ref)}/`;
	}
	return `https://tracker.beskid-lang.org/bugs/${encodeURIComponent(directive.ref)}`;
}

export function renderBeskidDirective(
	directive: BeskidMarkdownDirective,
): string {
	const href = directiveHref(directive);
	if (directive.kind === "code") {
		const [lang] = directive.ref.split(":", 2);
		return `<beskid-doc-embed kind="code" lang="${escapeHtml(lang ?? "text")}" ref="${escapeHtml(directive.ref)}"></beskid-doc-embed>`;
	}
	if (directive.kind === "graph") {
		return `<beskid-doc-embed kind="graph" ref="${escapeHtml(directive.ref)}" title="${escapeHtml(directive.title)}"></beskid-doc-embed>`;
	}
	if (directive.kind === "quote") {
		return `<beskid-doc-embed kind="quote" ref="${escapeHtml(directive.ref)}" title="${escapeHtml(directive.title)}"><blockquote><p>${escapeHtml(directive.title)}</p><a href="${escapeHtml(href)}">View article</a></blockquote></beskid-doc-embed>`;
	}
	return `<beskid-doc-embed kind="${directive.kind}" ref="${escapeHtml(directive.ref)}"><a href="${escapeHtml(href)}">${escapeHtml(directive.title)}</a></beskid-doc-embed>`;
}

export function transformBeskidDirectives(markdown: string): string {
	return markdown.replace(
		DIRECTIVE_FENCE,
		(source, kind: string, body: string) => {
			const directive = parseBeskidDirective(kind, body);
			return directive ? renderBeskidDirective(directive) : source;
		},
	);
}

import { BESKID_DOCS_ORIGIN, beskidDocsUrl } from "#/lib/beskid-docs-origin";

export interface SpecLink {
	href: string;
	path: string;
	title?: string;
}

const SPEC_PATH_RE = /\/platform-spec\/[\w./-]*/gi;
const SPEC_MARKER_RE = /^Spec:\s*(\/platform-spec\/[^\s]+)\s*$/gim;
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

function normalizeSpecPath(raw: string): string | null {
	const trimmed = raw.trim();
	if (trimmed.startsWith("/platform-spec/")) {
		return trimmed.replace(/\/+$/, "") || "/platform-spec";
	}
	try {
		const url = new URL(trimmed, BESKID_DOCS_ORIGIN);
		if (url.pathname.startsWith("/platform-spec")) {
			return url.pathname.replace(/\/+$/, "") || "/platform-spec";
		}
	} catch {
		return null;
	}
	return null;
}

function toSpecLink(path: string, title?: string): SpecLink {
	return {
		href: beskidDocsUrl(path),
		path,
		title,
	};
}

export function parseSpecLinks(body: string): SpecLink[] {
	const seen = new Set<string>();
	const links: SpecLink[] = [];

	const add = (path: string, title?: string) => {
		const normalized = normalizeSpecPath(path);
		if (!normalized || seen.has(normalized)) return;
		seen.add(normalized);
		links.push(toSpecLink(normalized, title));
	};

	for (const match of body.matchAll(MARKDOWN_LINK_RE)) {
		const title = match[1]?.trim();
		const target = match[2]?.trim();
		if (!target) continue;
		if (target.includes("platform-spec")) {
			add(target, title || undefined);
		}
	}

	for (const match of body.matchAll(SPEC_MARKER_RE)) {
		add(match[1] ?? "");
	}

	for (const match of body.matchAll(SPEC_PATH_RE)) {
		add(match[0]);
	}

	return links;
}

export function appendSpecMarker(body: string, path: string): string {
	const normalized = normalizeSpecPath(path);
	if (!normalized) return body;
	const marker = `Spec: ${normalized}`;
	if (body.includes(marker)) return body;
	const trimmed = body.trimEnd();
	return trimmed.length > 0 ? `${trimmed}\n\n${marker}\n` : `${marker}\n`;
}

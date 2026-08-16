/**
 * Shared helpers for GitHub source code embedding.
 *
 * Used by both the markdown directive renderer (server-side HTML
 * generation) and the {@link GitHubCodeSnippet} React component
 * (client-side fetch + highlight) so language detection, line-range
 * parsing, and URL building stay in one place.
 */

/** Map a repo-relative file path to a lowlight language id. */
export function detectLangFromPath(path: string): string {
	const ext = path.split(".").pop()?.toLowerCase() ?? "";
	switch (ext) {
		case "rs":
			return "rust";
		case "ts":
		case "tsx":
			return "typescript";
		case "js":
		case "jsx":
		case "mjs":
		case "cjs":
			return "javascript";
		case "json":
			return "json";
		case "md":
		case "markdown":
			return "markdown";
		case "yaml":
		case "yml":
			return "yaml";
		case "toml":
			return "toml";
		case "sh":
		case "bash":
			return "bash";
		case "html":
			return "html";
		case "css":
			return "css";
		case "isle":
		case "pest":
		case "bd":
			return "text";
		default:
			return ext || "text";
	}
}

/** Parse a `lines` directive value (e.g. `"1-26"`, `"42"`) into a 1-based range. */
export function parseLineRange(
	lines: string | undefined | null,
): { start: number; end: number } | null {
	if (!lines) return null;
	const trimmed = lines.trim();
	const single = trimmed.match(/^(\d+)$/);
	if (single) {
		const n = Number(single[1]);
		return Number.isFinite(n) && n > 0 ? { start: n, end: n } : null;
	}
	const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
	if (range) {
		const start = Number(range[1]);
		const end = Number(range[2]);
		if (
			Number.isFinite(start) &&
			Number.isFinite(end) &&
			start > 0 &&
			end >= start
		) {
			return { start, end };
		}
	}
	return null;
}

/** Default branch used when a directive does not specify one. */
export const DEFAULT_GITHUB_BRANCH = "main";

/** Raw content URL for a repo file on the given branch (default `main`). */
export function githubRawUrl(
	repo: string,
	path: string,
	branch: string = DEFAULT_GITHUB_BRANCH,
): string {
	return `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
}

/** Blob URL with an optional line anchor (`#L1-L26`) on the given branch. */
export function githubBlobUrl(
	repo: string,
	path: string,
	range?: { start: number; end: number } | null,
	branch: string = DEFAULT_GITHUB_BRANCH,
): string {
	const base = `https://github.com/${repo}/blob/${branch}/${path}`;
	if (!range) return base;
	return range.start === range.end
		? `${base}#L${range.start}`
		: `${base}#L${range.start}-L${range.end}`;
}

/** Human-readable header label, e.g. `compiler/.../expressions.isle · L1–26`. */
export function githubSnippetLabel(
	path: string,
	range?: { start: number; end: number } | null,
): string {
	if (!range) return path;
	return range.start === range.end
		? `${path} · L${range.start}`
		: `${path} · L${range.start}–${range.end}`;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
	DEFAULT_GITHUB_BRANCH,
	detectLangFromPath,
	githubBlobUrl,
	githubRawUrl,
	githubSnippetLabel,
} from "#/lib/github-code";
import { highlightCodeToHtml } from "#/lib/lowlight-render";

export interface GitHubCodeSnippetProps {
	/** Repository in `owner/name` form, e.g. `Cyber-Nomad-Collective/beskid`. */
	repo: string;
	/** Repo-relative file path, e.g. `compiler/crates/beskid_isle/isle/expressions.isle`. */
	path: string;
	/** Git branch to fetch from (defaults to `main`). */
	branch?: string;
	/** 1-based first line to show. Omit to show the whole file. */
	startLine?: number;
	/** 1-based last line to show. Omit to show the whole file. */
	endLine?: number;
	/** Override the auto-detected lowlight language id. */
	lang?: string;
	/** Whether to render a line-number gutter (default `true`). */
	showLineNumbers?: boolean;
}

type LoadState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "ready"; code: string };

/** Inline SVG: GitHub mark. */
function GitHubIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="15"
			height="15"
			viewBox="0 0 16 16"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
		</svg>
	);
}

/** Inline SVG: copy-to-clipboard. */
function CopyIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="14"
			height="14"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M5 1.5C5 1.22386 5.22386 1 5.5 1H11.5C11.7761 1 12 1.22386 12 1.5V10.5C12 10.7761 11.7761 11 11.5 11H10V12H11.5C12.3284 12 13 11.3284 13 10.5V1.5C13 0.671573 12.3284 0 11.5 0H5.5C4.67157 0 4 0.671573 4 1.5V3H5V1.5Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
			<path
				d="M1.5 4C1.22386 4 1 4.22386 1 4.5V13.5C1 13.7761 1.22386 14 1.5 14H9.5C9.77614 14 10 13.7761 10 13.5V4.5C10 4.22386 9.77614 4 9.5 4H1.5ZM2 5H9V13H2V5Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * Fetches a source file from GitHub raw, slices it to an optional line
 * range, and renders it with lowlight syntax highlighting, line numbers,
 * a copy button, and a "View on GitHub" link.
 *
 * Used directly in JSX (e.g. manifest views) and hydrated into
 * `<beskid-doc-embed kind="github-code">` placeholders by
 * {@link SpecContent}.
 */
export function GitHubCodeSnippet({
	repo,
	path,
	branch = DEFAULT_GITHUB_BRANCH,
	startLine,
	endLine,
	lang,
	showLineNumbers = true,
}: GitHubCodeSnippetProps) {
	const resolvedLang = lang || detectLangFromPath(path);
	const range =
		startLine != null && endLine != null
			? { start: startLine, end: endLine }
			: null;
	const blobHref = githubBlobUrl(repo, path, range, branch);
	const label = githubSnippetLabel(path, range);

	const [state, setState] = useState<LoadState>({ status: "loading" });
	const [copied, setCopied] = useState(false);

	const load = useCallback(() => {
		setState({ status: "loading" });
		fetch(githubRawUrl(repo, path, branch))
			.then((res) => {
				if (!res.ok) {
					throw new Error(`GitHub raw fetch failed (${res.status})`);
				}
				return res.text();
			})
			.then((text) => setState({ status: "ready", code: text }))
			.catch((err) =>
				setState({
					status: "error",
					message: err instanceof Error ? err.message : String(err),
				}),
			);
	}, [repo, path, branch]);

	useEffect(() => {
		load();
	}, [load]);

	const { displayCode, firstLine } = useMemo(() => {
		if (state.status !== "ready") return { displayCode: "", firstLine: 1 };
		if (!range) return { displayCode: state.code, firstLine: 1 };
		const lines = state.code.split("\n");
		const start = Math.max(1, range.start);
		const end = Math.min(lines.length, range.end);
		return {
			displayCode: lines.slice(start - 1, end).join("\n"),
			firstLine: start,
		};
	}, [state, range]);

	const highlightedHtml = useMemo(
		() =>
			state.status === "ready"
				? highlightCodeToHtml(resolvedLang, displayCode)
				: "",
		[resolvedLang, displayCode, state.status],
	);

	const lineNumbers = useMemo(() => {
		if (state.status !== "ready") return "";
		const count = displayCode.split("\n").length;
		return Array.from({ length: count }, (_, i) => firstLine + i).join("\n");
	}, [displayCode, firstLine, state.status]);

	const copy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(displayCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Clipboard unavailable — silently ignore.
		}
	}, [displayCode]);

	return (
		<figure className="spec-github-code rounded-lg border border-border bg-muted/40 overflow-hidden">
			<figcaption className="flex items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-2">
				<span className="truncate font-mono text-xs text-muted-foreground">
					{label}
				</span>
				<span className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={copy}
						className="inline-flex items-center gap-1 rounded-md border border-border bg-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
						aria-label="Copy code"
					>
						<CopyIcon />
						{copied ? "Copied" : "Copy"}
					</button>
					<a
						href={blobHref}
						target="_blank"
						rel="noreferrer noopener"
						className="inline-flex items-center gap-1 rounded-md border border-border bg-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						<GitHubIcon />
						View on GitHub
					</a>
				</span>
			</figcaption>

			{state.status === "loading" ? (
				<div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
					<span className="spec-arch-spinner" aria-hidden="true" />
					Loading source from GitHub…
				</div>
			) : state.status === "error" ? (
				<div className="px-4 py-6 text-sm">
					<p className="text-destructive">Failed to load source: {state.message}</p>
					<a
						href={blobHref}
						target="_blank"
						rel="noreferrer noopener"
						className="mt-2 inline-block text-primary underline"
					>
						Open {path} on GitHub
					</a>
				</div>
			) : (
				<pre
					className={`spec-github-code__pre flex overflow-x-auto p-3 text-sm leading-relaxed ${
						showLineNumbers ? "" : "block"
					}`}
					data-language={resolvedLang}
				>
					{showLineNumbers ? (
						<code
							className="spec-github-code__gutter hljs select-none pr-3 text-right text-muted-foreground/60"
							aria-hidden="true"
						>
							{lineNumbers}
						</code>
					) : null}
					<code
						className={`hljs ${showLineNumbers ? "pl-3 border-l border-border" : ""}`}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: pre-rendered from lowlight AST
						dangerouslySetInnerHTML={{ __html: highlightedHtml }}
					/>
				</pre>
			)}
		</figure>
	);
}

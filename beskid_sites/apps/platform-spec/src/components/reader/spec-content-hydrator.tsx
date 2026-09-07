"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ArchitectureGraphEditor } from "#/components/reader/architecture-graph-editor";
import { GitHubCodeSnippet } from "#/components/reader/github-code-snippet";
import { coerceAuthorGraph } from "#/lib/architecture/graph-schema";

export interface SpecContentProps {
	html: string;
	className?: string;
}

/**
 * Renders server-rendered markdown HTML and progressively enhances
 * `<beskid-doc-embed>` placeholders with interactive React components:
 *
 * - `kind="author-graph"` → read-only ReactFlow editor
 * - `kind="github-code"` → {@link GitHubCodeSnippet} (fetch + highlight)
 *
 * This replaces the raw `dangerouslySetInnerHTML` div in the structured
 * document view so that inline author graph and GitHub source directives
 * hydrate into interactive React components after mount.
 */
export function SpecContent({ html, className }: SpecContentProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const rootsRef = useRef<Root[]>([]);

	// Re-hydrate whenever the rendered HTML changes (new embeds may appear).
	// biome-ignore lint/correctness/useExhaustiveDependencies: html drives the dangerouslySetInnerHTML DOM update
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Clean up any previous roots before re-hydrating.
		for (const root of rootsRef.current) {
			root.unmount();
		}
		rootsRef.current = [];

		const embeds = container.querySelectorAll(
			'beskid-doc-embed[kind="author-graph"]',
		);
		for (const embed of embeds) {
			const raw = embed.getAttribute("data-graph");
			if (!raw) continue;
			try {
				const graph = coerceAuthorGraph(JSON.parse(decodeURIComponent(raw)));
				if (!graph) continue;
				const editable = embed.getAttribute("data-editable") === "true";
				const heightAttr = embed.getAttribute("data-height");
				const heightNum = heightAttr ? Number(heightAttr) : NaN;
				const height =
					Number.isFinite(heightNum) && heightNum > 0 ? heightNum : 420;
				const mount = document.createElement("div");
				embed.replaceChildren(mount);
				const root = createRoot(mount);
				root.render(
					<ArchitectureGraphEditor
						graph={graph}
						readOnly={!editable}
						height={height}
					/>,
				);
				rootsRef.current.push(root);
			} catch {
				// Ignore invalid graph payloads — the fallback content remains.
			}
		}

		const codeEmbeds = container.querySelectorAll(
			'beskid-doc-embed[kind="github-code"]',
		);
		for (const embed of codeEmbeds) {
			const repo = embed.getAttribute("repo");
			const path = embed.getAttribute("path");
			if (!repo || !path) continue;
			const branch = embed.getAttribute("branch") || undefined;
			const startAttr = embed.getAttribute("start-line") || "";
			const endAttr = embed.getAttribute("end-line") || "";
			const startNum = Number(startAttr);
			const endNum = Number(endAttr);
			const lang = embed.getAttribute("lang") || undefined;
			const showLineNumbers = embed.getAttribute("show-line-numbers") !== "false";
			const mount = document.createElement("div");
			embed.replaceChildren(mount);
			const root = createRoot(mount);
			root.render(
				<GitHubCodeSnippet
					repo={repo}
					path={path}
					branch={branch}
					startLine={
						startAttr && Number.isFinite(startNum) && startNum > 0
							? startNum
							: undefined
					}
					endLine={
						endAttr && Number.isFinite(endNum) && endNum > 0 ? endNum : undefined
					}
					lang={lang}
					showLineNumbers={showLineNumbers}
				/>,
			);
			rootsRef.current.push(root);
		}

		return () => {
			for (const root of rootsRef.current) {
				root.unmount();
			}
			rootsRef.current = [];
		};
	}, [html]);

	return (
		<div
			ref={containerRef}
			className={className}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

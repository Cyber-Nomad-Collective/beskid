"use client";

import { useEffect, useMemo, useRef } from "react";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export interface SourceCodeEmbedProps {
	lang: string;
	code: string;
}

/**
 * Syntax-highlighted code block rendered with lowlight.
 * Hydrates <beskid-doc-embed kind="code"> custom elements
 * in the reader view, or used standalone in the editor preview.
 */
export function SourceCodeEmbed({ lang, code }: SourceCodeEmbedProps) {
	const preRef = useRef<HTMLPreElement>(null);

	const tree = useMemo(() => {
		try {
			return lowlight.highlight(lang, code);
		} catch {
			return lowlight.highlight("text", code);
		}
	}, [lang, code]);

	const html = useMemo(() => {
		const builder: string[] = [];
		function walk(node: any): void {
			if (node.type === "text") {
				builder.push(escapeHtml(node.value));
			} else if (node.type === "element") {
				const classes = (node.properties?.className ?? []).join(" ");
				builder.push(`<span class="${classes}">`);
				for (const child of node.children) walk(child);
				builder.push("</span>");
			}
		}
		function escapeHtml(s: string): string {
			return s
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;");
		}
		for (const child of tree.children) walk(child);
		return builder.join("");
	}, [tree]);

	// biome-ignore lint/security/noDangerouslySetInnerHtml: pre-rendered from lowlight AST
	return (
		<pre
			ref={preRef}
			className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed"
			data-language={lang}
		>
			<code
				className="hljs"
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</pre>
	);
}

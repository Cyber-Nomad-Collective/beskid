"use client";

import { useRef } from "react";

import { highlightCodeToHtml } from "#/lib/lowlight-render";

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

	const html = highlightCodeToHtml(lang, code);

	return (
		<pre
			ref={preRef}
			className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed"
			data-language={lang}
		>
			<code
				className="hljs"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: pre-rendered from lowlight AST
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</pre>
	);
}

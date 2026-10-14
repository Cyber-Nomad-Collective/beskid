import { cn } from "@cyber-nomad-collective/beskid-ui-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeView } from "#/components/code-view";
import type { Language } from "#/lib/highlight";

const FENCE_LANGUAGES: Record<string, Language> = {
	beskid: "beskid",
	bd: "beskid",
	bsk: "beskid",
	bsol: "bsol",
	bproj: "bsol",
	bws: "bsol",
	json: "json",
};

/**
 * Package-supplied Markdown (README, docs/, doc comments). Raw HTML is never
 * rendered: `react-markdown` emits React elements only, so a package cannot
 * inject markup into the registry page. Fenced Beskid/JSON blocks get the
 * same tokenizer as the file viewer.
 */
export function Markdown({
	source,
	className,
	compact = false,
}: {
	source: string;
	className?: string;
	/** Inline-ish rendering for table cells and summaries. */
	compact?: boolean;
}) {
	return (
		<div className={cn("pckg-prose", compact && "pckg-prose-compact", className)}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					a: ({ href, children }) => (
						<a
							href={href}
							rel="noopener noreferrer"
							target={href?.startsWith("http") ? "_blank" : undefined}
						>
							{children}
						</a>
					),
					pre: ({ children }) => <>{children}</>,
					code: ({ className: codeClass, children }) => {
						const text = String(children ?? "").replace(/\n$/, "");
						const fence = /language-([\w-]+)/.exec(codeClass ?? "")?.[1];
						if (fence === undefined && !text.includes("\n")) {
							return <code>{text}</code>;
						}
						return (
							<CodeView
								source={text}
								language={FENCE_LANGUAGES[fence ?? ""] ?? "text"}
								className="my-3"
							/>
						);
					},
				}}
			>
				{source}
			</ReactMarkdown>
		</div>
	);
}

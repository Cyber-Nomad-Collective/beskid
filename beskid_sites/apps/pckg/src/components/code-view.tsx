import { cn } from "@cyber-nomad-collective/beskid-ui-react";
import { useMemo } from "react";
import { type Language, tokenize } from "#/lib/highlight";

/**
 * Line-numbered source view with the dependency-free tokenizer. Token kinds
 * map to `pckg-tok-*` classes defined in `styles.css` so colors follow the
 * shared Beskid design tokens in both themes.
 */
export function CodeView({
	source,
	language,
	className,
	startLine = 1,
	highlightLines,
}: {
	source: string;
	language: Language;
	className?: string;
	startLine?: number;
	/** Inclusive 1-based line range to emphasize (for example a declaration). */
	highlightLines?: [number, number];
}) {
	const lines = useMemo(
		() => tokenize(source.replace(/\n$/, ""), language),
		[source, language],
	);
	const width = String(startLine + lines.length - 1).length;
	return (
		<pre
			className={cn(
				"pckg-code overflow-x-auto rounded-md border border-border bg-muted/40 p-0 font-mono text-[13px] leading-6",
				className,
			)}
			data-language={language}
		>
			<code className="block min-w-full">
				{lines.map((tokens, index) => {
					const number = startLine + index;
					const emphasized =
						highlightLines !== undefined &&
						number >= highlightLines[0] &&
						number <= highlightLines[1];
					return (
						<span
							key={number}
							className={cn("flex", emphasized && "bg-primary/10")}
							data-line={number}
						>
							<span
								aria-hidden="true"
								className="sticky left-0 shrink-0 select-none border-r border-border bg-muted/60 px-3 text-right text-muted-foreground"
								style={{ minWidth: `${width + 2}ch` }}
							>
								{number}
							</span>
							<span className="whitespace-pre px-4">
								{tokens.map((token, tokenIndex) => {
									// Tokens are positional and immutable, so the index is a stable key.
									const key = `${number}:${tokenIndex}`;
									return token.kind === "plain" ? (
										<span key={key}>{token.text}</span>
									) : (
										<span key={key} className={`pckg-tok-${token.kind}`}>
											{token.text}
										</span>
									);
								})}
							</span>
						</span>
					);
				})}
			</code>
		</pre>
	);
}

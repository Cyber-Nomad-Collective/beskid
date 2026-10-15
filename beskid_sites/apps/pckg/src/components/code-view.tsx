import { cn } from "@cyber-nomad-collective/beskid-ui-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { highlightLines as highlight } from "#/lib/highlighter";
import type { Language } from "#/lib/languages";

type Line = { text: string; style?: CSSProperties }[];

/**
 * Line-numbered source view. Plain text renders first (and during SSR); Shiki
 * tokens replace it once the highlighter loads. Dark colors arrive as the
 * `--shiki-dark` variable that `styles.css` applies under the dark theme.
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
	const text = source.replace(/\n$/, "");
	const plain = useMemo<Line[]>(
		() => text.split("\n").map((line) => [{ text: line }]),
		[text],
	);
	const [highlighted, setHighlighted] = useState<{
		key: string;
		lines: Line[];
	}>();
	const key = `${language}\u0000${text}`;

	useEffect(() => {
		let current = true;
		highlight(text, language).then(
			(tokens) => {
				if (current && tokens) {
					setHighlighted({
						key,
						lines: tokens.map((line) =>
							line.map((token) => ({
								text: token.content,
								style: token.htmlStyle as CSSProperties | undefined,
							})),
						),
					});
				}
			},
			() => {
				// Highlighting is cosmetic; the plain rendering stays on failure.
			},
		);
		return () => {
			current = false;
		};
	}, [key, text, language]);

	const lines = highlighted?.key === key ? highlighted.lines : plain;
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
								{tokens.map((token, tokenIndex) => (
									// Tokens are positional and immutable, so the index is a stable key.
									<span key={`${number}:${tokenIndex}`} style={token.style}>
										{token.text}
									</span>
								))}
							</span>
						</span>
					);
				})}
			</code>
		</pre>
	);
}

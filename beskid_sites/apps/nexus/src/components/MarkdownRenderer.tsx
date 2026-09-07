import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "@/lib/lucide-icons";
import { MermaidDiagram } from "./MermaidDiagram";
import { parseTypedDocLink, TypedDocLinkCard } from "./typed-doc-link";

// Custom syntax theme
const customTheme = {
	...vscDarkPlus,
	'pre[class*="language-"]': {
		...vscDarkPlus['pre[class*="language-"]'],
		background: "#0a0a10",
		margin: 0,
		padding: "16px 0",
		fontSize: "13px",
		lineHeight: "1.6",
	},
	'code[class*="language-"]': {
		...vscDarkPlus['code[class*="language-"]'],
		background: "transparent",
		fontFamily: '"JetBrains Mono", "Fira Code", monospace',
	},
};

interface MarkdownRendererProps {
	content: string;
	onLinkClick?: (href: string) => void;
	showCopyButton?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
	content,
	onLinkClick,
	showCopyButton = false,
}) => {
	const [copied, setCopied] = useState(false);
	const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		return () => {
			if (copyTimerRef.current) {
				clearTimeout(copyTimerRef.current);
			}
		};
	}, []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			if (copyTimerRef.current) {
				clearTimeout(copyTimerRef.current);
			}
			copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Helper to format text for display (convert [[links]] to markdown links)
	const formatMarkdownForDisplay = (md: string) => {
		// Avoid rewriting inside fenced code blocks.
		const parts = md.split("```");
		for (let i = 0; i < parts.length; i += 2) {
			// Pattern 1: File grounding - [[file.ext]]
			parts[i] = parts[i].replace(
				/\[\[([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+(?::\d+(?:[-–]\d+)?)?)\]\]/g,
				(_m, inner: string) => {
					const trimmed = inner.trim();
					const href = `code-ref:${encodeURIComponent(trimmed)}`;
					return `[${trimmed}](${href})`;
				},
			);

			// Pattern 2: Node grounding - [[Type:Name]]
			parts[i] = parts[i].replace(
				/\[\[(?:graph:)?(Class|Function|Method|Interface|File|Folder|Variable|Enum|Type|CodeElement):([^\]]+)\]\]/g,
				(_m, nodeType: string, nodeName: string) => {
					const trimmed = `${nodeType}:${nodeName.trim()}`;
					const href = `node-ref:${encodeURIComponent(trimmed)}`;
					return `[${trimmed}](${href})`;
				},
			);
		}
		return parts.join("```");
	};

	const handleLinkClick = React.useCallback(
		(e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
			if (href.startsWith("code-ref:") || href.startsWith("node-ref:")) {
				e.preventDefault();
				onLinkClick?.(href);
			}
			// External links open in new tab (default behavior)
		},
		[onLinkClick],
	);

	const formattedContent = React.useMemo(
		() => formatMarkdownForDisplay(content),
		[content, formatMarkdownForDisplay],
	);

	const markdownComponents = React.useMemo(
		() => ({
			a: ({ href, children, ...props }: any) => {
				const hrefStr = href || "";

				// Grounding links (Code refs & Node refs)
				if (hrefStr.startsWith("code-ref:") || hrefStr.startsWith("node-ref:")) {
					const isNodeRef = hrefStr.startsWith("node-ref:");
					const inner = decodeURIComponent(hrefStr.slice(isNodeRef ? 9 : 9)); // length is same? wait.. code-ref: (9), node-ref: (9). Yes.

					// Styles
					const baseParams =
						"code-ref-btn inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[12px] !no-underline hover:!no-underline transition-colors";
					const colorParams = isNodeRef
						? "border border-primary/35 bg-primary/10 !text-primary visited:!text-primary hover:bg-primary/15 hover:border-primary/50"
						: "border border-accent/35 bg-accent/10 !text-accent-foreground visited:!text-accent-foreground hover:bg-accent/15 hover:border-accent/50";

					return (
						<a
							href={hrefStr}
							onClick={(e) => handleLinkClick(e, hrefStr)}
							className={`${baseParams} ${colorParams}`}
							title={
								isNodeRef
									? `View ${inner} in Code panel`
									: `Open in Code panel • ${inner}`
							}
							{...props}
						>
							<span className="text-inherit">{children}</span>
						</a>
					);
				}

				// External links
				return (
					<a
						href={hrefStr}
						className="text-primary underline underline-offset-2 hover:text-purple-300"
						target="_blank"
						rel="noopener noreferrer"
						{...props}
					>
						{children}
					</a>
				);
			},
			code: ({ className, children, ...props }: any) => {
				const match = /language-(\w+)/.exec(className || "");
				const isInline = !className && !match;
				const codeContent = String(children).replace(/\n$/, "");

				if (isInline) {
					return <code {...props}>{children}</code>;
				}

				const language = match ? match[1] : "text";

				// Render Mermaid diagrams
				if (language === "mermaid") {
					return <MermaidDiagram code={codeContent} />;
				}

				if (["spec", "book", "nexus", "bug"].includes(language)) {
					const link = parseTypedDocLink(language, codeContent);
					return link ? (
						<TypedDocLinkCard link={link} />
					) : (
						<code {...props}>{children}</code>
					);
				}

				return (
					<SyntaxHighlighter
						style={customTheme}
						language={language}
						PreTag="div"
						customStyle={{
							margin: 0,
							padding: "14px 16px",
							borderRadius: "8px",
							fontSize: "13px",
							background: "#0a0a10",
							border: "1px solid #1e1e2a",
						}}
					>
						{codeContent}
					</SyntaxHighlighter>
				);
			},
			pre: ({ children }: any) => <>{children}</>,
		}),
		[handleLinkClick],
	);

	return (
		<div className="text-sm text-foreground">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				urlTransform={(url) => {
					if (url.startsWith("code-ref:") || url.startsWith("node-ref:")) return url;
					// Default behavior for http/https/etc
					return url;
				}}
				components={markdownComponents}
			>
				{formattedContent}
			</ReactMarkdown>

			{/* Copy Button */}
			{showCopyButton && (
				<div className="mt-2 flex justify-end">
					<button
						onClick={handleCopy}
						className="flex items-center gap-1.5 rounded border border-transparent px-2 py-1 text-xs text-muted-foreground transition-all hover:border-border hover:bg-card hover:text-foreground"
						title="Copy to clipboard"
					>
						{copied ? (
							<Check className="h-3.5 w-3.5 text-emerald-400" />
						) : (
							<Copy className="h-3.5 w-3.5" />
						)}
						<span>{copied ? "Copied" : "Copy"}</span>
					</button>
				</div>
			)}
		</div>
	);
};

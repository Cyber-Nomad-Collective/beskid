"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "#/lib/utils";

interface MarkdownContentProps {
	children: string;
	className?: string;
	/** When true, render nothing if content is empty. */
	optional?: boolean;
	emptyFallback?: string;
	/** Slightly larger prose for page headers (version overview). */
	size?: "sm" | "md";
}

export function MarkdownContent({
	children,
	className,
	optional = false,
	emptyFallback = "No content.",
	size = "sm",
}: MarkdownContentProps) {
	const trimmed = children.trim();

	if (!trimmed) {
		if (optional) return null;
		return (
			<p className={cn("text-muted-foreground text-sm italic", className)}>
				{emptyFallback}
			</p>
		);
	}

	return (
		<div
			className={cn(
				"prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed",
				size === "sm" && "prose-sm text-sm",
				size === "md" && "prose-base",
				"[&_p]:text-muted-foreground [&_li]:text-muted-foreground",
				className,
			)}
		>
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{trimmed}</ReactMarkdown>
		</div>
	);
}

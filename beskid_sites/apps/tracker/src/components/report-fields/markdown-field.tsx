"use client";

import { Bold, Code, Italic, List, ListOrdered, Quote } from "lucide-react";
import { useRef, useState } from "react";

import { MarkdownContent } from "#/components/markdown-content";
import { ReportFieldChrome } from "#/components/report-fields/report-field-chrome";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";

interface MarkdownFieldProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	hint?: string;
	required?: boolean;
	disabled?: boolean;
	rows?: number;
}

export function MarkdownField({
	id,
	label,
	value,
	onChange,
	placeholder,
	hint,
	required,
	disabled,
	rows = 5,
}: MarkdownFieldProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [mode, setMode] = useState<"write" | "preview">("write");

	const wrapSelection = (prefix: string, suffix = prefix) => {
		const el = textareaRef.current;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const selected = value.slice(start, end);
		const next =
			value.slice(0, start) + prefix + selected + suffix + value.slice(end);
		onChange(next);
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(start + prefix.length, end + prefix.length);
		});
	};

	const insertLinePrefix = (prefix: string) => {
		const el = textareaRef.current;
		if (!el) return;
		const start = el.selectionStart;
		const lineStart = value.lastIndexOf("\n", start - 1) + 1;
		const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
		onChange(next);
	};

	return (
		<ReportFieldChrome
			id={id}
			label={label}
			hint={hint}
			required={required}
			className="work-item-markdown"
		>
			<div className="work-item-markdown__shell overflow-hidden rounded-lg border border-border/80 bg-background shadow-xs">
				<div className="border-border/60 bg-muted/30 flex flex-wrap items-center gap-0.5 border-b px-1 py-1">
					<ToolbarIcon
						label="Bold"
						disabled={disabled}
						onClick={() => wrapSelection("**")}
					>
						<Bold className="size-3.5" />
					</ToolbarIcon>
					<ToolbarIcon
						label="Italic"
						disabled={disabled}
						onClick={() => wrapSelection("_")}
					>
						<Italic className="size-3.5" />
					</ToolbarIcon>
					<ToolbarIcon
						label="Code"
						disabled={disabled}
						onClick={() => wrapSelection("`")}
					>
						<Code className="size-3.5" />
					</ToolbarIcon>
					<span className="bg-border/80 mx-1 h-4 w-px" aria-hidden />
					<ToolbarIcon
						label="Bullet list"
						disabled={disabled}
						onClick={() => insertLinePrefix("- ")}
					>
						<List className="size-3.5" />
					</ToolbarIcon>
					<ToolbarIcon
						label="Numbered list"
						disabled={disabled}
						onClick={() => insertLinePrefix("1. ")}
					>
						<ListOrdered className="size-3.5" />
					</ToolbarIcon>
					<ToolbarIcon
						label="Quote"
						disabled={disabled}
						onClick={() => insertLinePrefix("> ")}
					>
						<Quote className="size-3.5" />
					</ToolbarIcon>
					<div className="ml-auto flex gap-0.5 pr-1">
						<Button
							type="button"
							variant={mode === "write" ? "secondary" : "ghost"}
							size="sm"
							className="h-7 px-2.5 text-xs"
							disabled={disabled}
							onClick={() => setMode("write")}
						>
							Write
						</Button>
						<Button
							type="button"
							variant={mode === "preview" ? "secondary" : "ghost"}
							size="sm"
							className="h-7 px-2.5 text-xs"
							disabled={disabled}
							onClick={() => setMode("preview")}
						>
							Preview
						</Button>
					</div>
				</div>

				{mode === "write" ? (
					<Textarea
						ref={textareaRef}
						id={id}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						rows={rows}
						disabled={disabled}
						className="min-h-[7rem] resize-y rounded-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus-visible:ring-0"
					/>
				) : (
					<div className="min-h-[7rem] px-3 py-2.5">
						<MarkdownContent
							className={cn(!value.trim() && "text-muted-foreground italic")}
							emptyFallback="Nothing to preview yet."
						>
							{value}
						</MarkdownContent>
					</div>
				)}
			</div>
		</ReportFieldChrome>
	);
}

function ToolbarIcon({
	label,
	children,
	onClick,
	disabled,
}: {
	label: string;
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			className="size-7"
			disabled={disabled}
			aria-label={label}
			onClick={onClick}
		>
			{children}
		</Button>
	);
}

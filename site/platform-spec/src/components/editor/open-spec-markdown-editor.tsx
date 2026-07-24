"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useState } from "react";

import { StructuredDocumentView } from "#/components/reader/structured-document-view";
import { renderMarkdownToHtml } from "#/lib/markdown";
import type { SpecLayout } from "#/lib/spec/layouts-pure";
import { validateLayout } from "#/lib/spec/layouts-pure";

export interface OpenSpecMarkdownEditorProps {
	value: string;
	readOnly?: boolean;
	layout?: SpecLayout | null;
	title?: string;
	onChange: (markdown: string) => void;
}

function htmlToMarkdown(html: string): string {
	const doc = new DOMParser().parseFromString(html, "text/html");
	const walk = (node: Node): string => {
		if (node.nodeType === Node.TEXT_NODE) {
			return node.textContent ?? "";
		}
		if (!(node instanceof HTMLElement)) return "";
		const children = Array.from(node.childNodes).map(walk).join("");
		switch (node.tagName.toLowerCase()) {
			case "h1":
				return `# ${children.trim()}\n\n`;
			case "h2":
				return `## ${children.trim()}\n\n`;
			case "h3":
				return `### ${children.trim()}\n\n`;
			case "h4":
				return `#### ${children.trim()}\n\n`;
			case "p":
				return `${children.trim()}\n\n`;
			case "strong":
			case "b":
				return `**${children}**`;
			case "em":
			case "i":
				return `*${children}*`;
			case "code":
				return node.parentElement?.tagName.toLowerCase() === "pre"
					? children
					: `\`${children}\``;
			case "pre":
				return `\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
			case "blockquote":
				return (
					children
						.trim()
						.split("\n")
						.map((line) => `> ${line}`)
						.join("\n") + "\n\n"
				);
			case "ul":
				return (
					Array.from(node.children)
						.map((li) => `- ${walk(li).trim()}`)
						.join("\n") + "\n\n"
				);
			case "ol":
				return (
					Array.from(node.children)
						.map((li, index) => `${index + 1}. ${walk(li).trim()}`)
						.join("\n") + "\n\n"
				);
			case "li":
				return children;
			case "a": {
				const href = node.getAttribute("href") ?? "";
				return `[${children}](${href})`;
			}
			case "br":
				return "\n";
			default:
				return children;
		}
	};
	return (
		walk(doc.body)
			.replace(/\n{3,}/g, "\n\n")
			.trimEnd() + "\n"
	);
}

export function OpenSpecMarkdownEditor({
	value,
	readOnly = false,
	layout = null,
	title = "Draft document",
	onChange,
}: OpenSpecMarkdownEditorProps) {
	const [tab, setTab] = useState<"visual" | "source" | "fidelity">("visual");
	const [pendingVisual, setPendingVisual] = useState<string | null>(null);
	const layoutValidation = useMemo(
		() =>
			layout
				? {
						layoutId: layout.id,
						ok: validateLayout(value, layout).length === 0,
						violations: validateLayout(value, layout),
					}
				: null,
		[layout, value],
	);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3, 4] },
			}),
			Link.configure({ openOnClick: false }),
		],
		content: renderMarkdownToHtml(value),
		editable: !readOnly,
		immediatelyRender: false,
		onUpdate: ({ editor: current }) => {
			const next = htmlToMarkdown(current.getHTML());
			setPendingVisual(next);
		},
	});

	useEffect(() => {
		if (!editor) return;
		if (tab !== "visual") return;
		const current = htmlToMarkdown(editor.getHTML());
		if (current.trim() === value.trim()) return;
		editor.commands.setContent(renderMarkdownToHtml(value), {
			emitUpdate: false,
		});
	}, [editor, tab, value]);

	return (
		<section className="space-y-3">
			<div className="flex flex-wrap gap-2">
				{(["visual", "source", "fidelity"] as const).map((name) => (
					<button
						key={name}
						type="button"
						className={`rounded-md border px-3 py-1.5 text-sm ${
							tab === name ? "bg-muted" : ""
						}`}
						onClick={() => setTab(name)}
					>
						{name === "visual"
							? "WYSIWYG"
							: name === "source"
								? "Source"
								: "Reader preview"}
					</button>
				))}
			</div>

			{layoutValidation && layoutValidation.violations.length > 0 ? (
				<ul
					className="space-y-1 rounded-md border border-amber-400/30 bg-amber-500/5 p-3 text-xs text-amber-100"
					aria-live="polite"
				>
					{layoutValidation.violations.map((violation) => (
						<li key={`${violation.code}-${violation.heading ?? ""}`}>
							{violation.message}
						</li>
					))}
				</ul>
			) : null}

			{tab === "visual" ? (
				<div className="space-y-2">
					<div
						className="flex flex-wrap gap-1"
						role="toolbar"
						aria-label="Formatting"
					>
						{(
							[
								["bold", () => editor?.chain().focus().toggleBold().run()],
								["italic", () => editor?.chain().focus().toggleItalic().run()],
								["code", () => editor?.chain().focus().toggleCode().run()],
								["H2", () => editor?.chain().focus().toggleHeading({ level: 2 }).run()],
								["H3", () => editor?.chain().focus().toggleHeading({ level: 3 }).run()],
								["ul", () => editor?.chain().focus().toggleBulletList().run()],
								["ol", () => editor?.chain().focus().toggleOrderedList().run()],
								["quote", () => editor?.chain().focus().toggleBlockquote().run()],
							] as const
						).map(([label, action]) => (
							<button
								key={label}
								type="button"
								className="rounded border px-2 py-1 text-xs"
								disabled={readOnly || !editor}
								onClick={() => action()}
							>
								{label}
							</button>
						))}
					</div>
					<div className="spec-prose prose prose-invert min-h-80 rounded-md border bg-background px-3 py-2">
						<EditorContent editor={editor} />
					</div>
					{pendingVisual && pendingVisual !== value && !readOnly ? (
						<div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
							<p>Apply WYSIWYG changes to Markdown source?</p>
							<div className="mt-2 flex gap-2">
								<button
									type="button"
									className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
									onClick={() => {
										onChange(pendingVisual);
										setPendingVisual(null);
									}}
								>
									Apply source update
								</button>
								<button
									type="button"
									className="rounded-md border px-3 py-1.5"
									onClick={() => {
										setPendingVisual(null);
										editor?.commands.setContent(renderMarkdownToHtml(value), {
											emitUpdate: false,
										});
									}}
								>
									Discard
								</button>
							</div>
						</div>
					) : null}
				</div>
			) : null}

			{tab === "source" ? (
				<textarea
					className="min-h-96 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
					value={value}
					disabled={readOnly}
					onChange={(event) => onChange(event.target.value)}
				/>
			) : null}

			{tab === "fidelity" ? (
				<StructuredDocumentView
					title={title}
					bodyMd={value}
					layout={layout}
					layoutValidation={layoutValidation}
					showEditLink={false}
				/>
			) : null}
		</section>
	);
}

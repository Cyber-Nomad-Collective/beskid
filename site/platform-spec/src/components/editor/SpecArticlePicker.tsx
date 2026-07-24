"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileText, Search, X } from "lucide-react";

import {
	createNavSearchResult,
	highlightTitle,
} from "#/components/reader/spec-nav-tree";
import type { OpenSpecNavNode } from "#/lib/spec/domain-model";

export interface SpecArticlePickerProps {
	open: boolean;
	navTree: OpenSpecNavNode;
	onInsert: (fence: string) => void;
	onCancel: () => void;
}

/**
 * Dialog for picking a specification article and inserting a quote directive
 * fence into the editor. Uses the spec nav-tree search index for fast lookup.
 */
export function SpecArticlePicker({
	open,
	navTree,
	onInsert,
	onCancel,
}: SpecArticlePickerProps) {
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<{
		title: string;
		ref: string;
		href: string;
	} | null>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const searchResult = useMemo(
		() => (query.trim() ? createNavSearchResult(navTree, query) : null),
		[navTree, query],
	);

	useEffect(() => {
		const d = dialogRef.current;
		if (!d) return;
		if (open) {
			if (!d.open) d.showModal();
			setTimeout(() => inputRef.current?.focus(), 50);
		} else {
			if (d.open) d.close();
			setQuery("");
			setSelected(null);
		}
	}, [open]);

	const handleInsert = () => {
		if (!selected) return;
		const ref = selected.ref;
		const title = selected.title;
		const fence = "```quote\nref: " + ref + "\ntitle: " + title + "\n```\n\n";
		onInsert(fence);
		setQuery("");
		setSelected(null);
	};

	if (!open) return null;

	return (
		<dialog
			ref={dialogRef}
			className="fixed inset-0 z-50 m-auto max-h-[80vh] w-full max-w-xl rounded-xl border border-border bg-background p-0 shadow-2xl backdrop:bg-black/50"
			onClose={onCancel}
		>
			<div className="flex h-full max-h-[80vh] flex-col">
				<div className="flex items-center justify-between border-b border-border px-5 py-3">
					<h2 className="text-base font-semibold">Quote spec article</h2>
					<button
						type="button"
						className="rounded-md p-1 hover:bg-muted"
						onClick={onCancel}
						aria-label="Close"
					>
						<X size={16} />
					</button>
				</div>

				<div className="flex min-h-0 flex-1 flex-col gap-3 px-5 py-4">
					<label className="relative block">
						<span className="sr-only">Search specification</span>
						<Search
							className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden
						/>
						<input
							ref={inputRef}
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setSelected(null);
							}}
							onKeyDown={(e) => {
								if (e.key === "Escape") onCancel();
							}}
							placeholder="Search by title or capability key..."
							className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm"
						/>
					</label>

					{searchResult ? (
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
							<p className="border-b border-border/60 px-3 py-1.5 text-[10px] font-medium uppercase text-muted-foreground">
								{searchResult.matchCount} result{searchResult.matchCount !== 1 ? "s" : ""}
							</p>
							<div className="min-h-0 flex-1 overflow-y-auto p-1">
								<PickerResults
									tree={searchResult.tree}
									query={query}
									selectedRef={selected?.ref}
									onSelect={(title, ref, href) =>
										setSelected({ title, ref, href })
									}
								/>
							</div>
						</div>
					) : (
						<p className="text-xs text-muted-foreground">
							Type to search specification articles.
						</p>
					)}
				</div>

				<div className="flex items-center justify-between border-t border-border px-5 py-3">
					<button
						type="button"
						className="rounded-md border px-3 py-1.5 text-sm"
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						type="button"
						className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
						disabled={!selected}
						onClick={handleInsert}
					>
						Insert quote
						<ArrowRight size={14} />
					</button>
				</div>
			</div>
		</dialog>
	);
}

function PickerResults({
	tree,
	query,
	selectedRef,
	onSelect,
}: {
	tree: OpenSpecNavNode | null;
	query: string;
	selectedRef?: string;
	onSelect: (title: string, ref: string, href: string) => void;
}) {
	if (!tree?.children) return null;

	function render(node: OpenSpecNavNode, depth: number): React.ReactNode[] {
		const isSelected = selectedRef === node.slug;
		return [
			<button
				key={node.slug}
				type="button"
				className={[
					"flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs transition-colors",
					isSelected
						? "bg-primary/15 text-primary"
						: "hover:bg-muted/60",
				].join(" ")}
				style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
				onClick={() => onSelect(node.title, node.slug, node.href)}
			>
				<FileText size={11} className="shrink-0 text-muted-foreground" />
				<span className="min-w-0 flex-1 truncate">
					{highlightTitle(node.title, query).map((range) =>
						range.match ? (
							<mark
								key={`${range.start}-${range.end}`}
								className="rounded bg-primary/20 px-0.5 text-inherit"
							>
								{node.title.slice(range.start, range.end)}
							</mark>
						) : (
							<span key={`${range.start}-${range.end}`}>
								{node.title.slice(range.start, range.end)}
							</span>
						),
					)}
				</span>
			</button>,
			...(node.children ?? []).flatMap((child) => render(child, depth + 1)),
		];
	}

	return <>{tree.children.flatMap((child) => render(child, 0))}</>;
}

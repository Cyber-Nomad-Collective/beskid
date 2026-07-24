" use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { MessageSquare, Quote, Search } from "lucide-react";

import {
	createNavSearchResult,
	highlightTitle,
} from "#/components/reader/spec-nav-tree";
import type { OpenSpecNavNode } from "#/lib/spec/domain-model";

export interface HighlightToolbarProps {
	navTree: OpenSpecNavNode;
	reviewMode?: boolean;
	onQuote?: (text: string) => void;
	onComment?: (text: string) => void;
}

export function HighlightToolbar({
	navTree,
	reviewMode = false,
	onQuote,
	onComment,
}: HighlightToolbarProps) {
	const [selection, setSelection] = useState<{
		text: string;
		x: number;
		y: number;
	} | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const toolbarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleMouseUp = () => {
			requestAnimationFrame(() => {
				const sel = window.getSelection();
				if (!sel || sel.isCollapsed || !sel.toString().trim()) {
					setSelection(null);
					setSearchOpen(false);
					return;
				}
				const range = sel.getRangeAt(0);
				const rect = range.getBoundingClientRect();
				setSelection({
					text: sel.toString().trim().slice(0, 200),
					x: rect.left + rect.width / 2,
					y: rect.top,
				});
			});
		};

		document.addEventListener("mouseup", handleMouseUp);
		return () => document.removeEventListener("mouseup", handleMouseUp);
	}, []);

	useEffect(() => {
		if (!selection) return;
		const handleClick = (e: MouseEvent) => {
			if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
				setSelection(null);
				setSearchOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [selection]);

	if (!selection) return null;

	const searchResult = searchOpen
		? createNavSearchResult(navTree, selection.text)
		: null;

	const toolbarHeight = 36;
	const clampedY = Math.max(8, Math.min(selection.y - toolbarHeight - 4, window.innerHeight - 120));
	const clampedX = Math.max(120, Math.min(selection.x, window.innerWidth - 120));

	return (
		<div
			ref={toolbarRef}
			className="fixed z-50"
			style={{ left: clampedX, top: clampedY, transform: "translateX(-50%)" }}
			role="toolbar"
			aria-label="Text selection actions"
		>
			<div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg">
				<button
					type="button"
					className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
					onClick={() => setSearchOpen((v) => !v)}
					aria-label="Search specification for selected text"
				>
					<Search size={13} />
					<span className="hidden sm:inline">Search</span>
				</button>
				{reviewMode ? (
					<>
						<button
							type="button"
							className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
							onClick={() => { onQuote?.(selection.text); setSelection(null); }}
							aria-label="Quote selection in review"
						>
							<Quote size={13} />
							<span className="hidden sm:inline">Quote</span>
						</button>
						<button
							type="button"
							className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
							onClick={() => { onComment?.(selection.text); setSelection(null); }}
							aria-label="Add comment on selection"
						>
							<MessageSquare size={13} />
							<span className="hidden sm:inline">Comment</span>
						</button>
					</>
				) : null}
			</div>

			{searchOpen ? (
				<div className="mt-1 max-h-56 w-72 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg">
					{searchResult && searchResult.matchingSlugs.size > 0 ? (
						<>
							<p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
								{searchResult.matchCount} match{searchResult.matchCount !== 1 ? "es" : ""}
							</p>
							<SearchResultsList tree={searchResult.tree} query={selection.text} />
						</>
					) : (
						<p className="text-xs text-muted-foreground">No matches in specification.</p>
					)}
				</div>
			) : null}
		</div>
	);
}

function HighlightedTitle({ title, query }: { title: string; query: string }) {
	return highlightTitle(title, query).map((range) =>
		range.match ? (
			<mark key={`${range.start}-${range.end}`} className="rounded bg-primary/20 px-0.5 text-inherit">
				{title.slice(range.start, range.end)}
			</mark>
		) : (
			<span key={`${range.start}-${range.end}`}>{title.slice(range.start, range.end)}</span>
		),
	);
}

function SearchResultsList({ tree, query }: { tree: OpenSpecNavNode | null; query: string }) {
	if (!tree?.children) return null;

	function render(node: OpenSpecNavNode, depth: number): ReactNode {
		return (
			<Fragment key={node.slug}>
				<a
					href={node.href}
					className="block rounded px-2 py-1 text-xs leading-relaxed hover:bg-muted"
					style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
				>
					<HighlightedTitle title={node.title} query={query} />
				</a>
				{node.children?.map((child) => render(child, depth + 1))}
			</Fragment>
		);
	}

	return <>{tree.children.map((child) => render(child, 0))}</>;
}

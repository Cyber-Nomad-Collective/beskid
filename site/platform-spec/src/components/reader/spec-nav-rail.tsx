"use client";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
	filterNavTree,
	findActivePath,
	highlightTitle,
} from "#/components/reader/spec-nav-tree";
import type { OpenSpecNavNode as NavTreeNode } from "#/server/openspec/reader";

interface SpecNavRailProps {
	tree: NavTreeNode;
	activeSlug?: string;
	onNavigate?: () => void;
}

function visibleNodeCount(node: NavTreeNode): number {
	return 1 + (node.children?.reduce((count, child) => count + visibleNodeCount(child), 0) ?? 0);
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

function moveTreeFocus(link: HTMLAnchorElement, direction: 1 | -1) {
	const tree = link.closest<HTMLElement>('[role="tree"]');
	if (!tree) return;
	const links = [...tree.querySelectorAll<HTMLAnchorElement>("a[data-spec-tree-link]")];
	const index = links.indexOf(link);
	links[index + direction]?.focus();
}

function NavNode({
	node,
	activeSlug,
	query,
	expanded,
	onToggle,
	onNavigate,
	depth = 0,
}: {
	node: NavTreeNode;
	activeSlug?: string;
	query: string;
	expanded: Set<string>;
	onToggle: (slug: string) => void;
	onNavigate?: () => void;
	depth?: number;
}) {
	const isActive = activeSlug === node.slug;
	const hasChildren = Boolean(node.children?.length);
	const isExpanded = expanded.has(node.slug);
	const paddingLeft = `${0.5 + depth * 0.75}rem`;
	const linkRef = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		if (isActive) linkRef.current?.scrollIntoView({ block: "nearest" });
	}, [isActive]);

	return (
		<li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isActive}>
			<div className="flex items-center" style={{ paddingLeft }}>
				{hasChildren ? (
					<button
						type="button"
						className="flex size-7 shrink-0 items-center justify-center rounded hover:bg-muted"
						aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.title}`}
						onClick={() => onToggle(node.slug)}
						onKeyDown={(event) => {
							if (event.key === "ArrowRight" && !isExpanded) onToggle(node.slug);
							if (event.key === "ArrowLeft" && isExpanded) onToggle(node.slug);
						}}
					>
						{isExpanded ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
					</button>
				) : (
					<span className="inline-block size-7 shrink-0" aria-hidden />
				)}
				<Link
					ref={linkRef}
					data-spec-tree-link
					to={node.href}
					className={[
						"min-w-0 flex-1 rounded-md px-2 py-1.5 text-sm transition-colors",
						isActive ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
					].join(" ")}
					onClick={onNavigate}
					onKeyDown={(event) => {
						if (event.key === "ArrowDown") {
							event.preventDefault();
							moveTreeFocus(event.currentTarget, 1);
						}
						if (event.key === "ArrowUp") {
							event.preventDefault();
							moveTreeFocus(event.currentTarget, -1);
						}
						if (hasChildren && event.key === "ArrowRight" && !isExpanded) onToggle(node.slug);
						if (hasChildren && event.key === "ArrowLeft" && isExpanded) onToggle(node.slug);
					}}
				>
					<HighlightedTitle title={node.title} query={query} />
				</Link>
			</div>
			{hasChildren && isExpanded ? (
				<ul role="group" className="space-y-0.5">
					{node.children?.map((child) => (
						<NavNode key={child.slug} node={child} activeSlug={activeSlug} query={query} expanded={expanded} onToggle={onToggle} onNavigate={onNavigate} depth={depth + 1} />
					))}
				</ul>
			) : null}
		</li>
	);
}

export function SpecNavRail({ tree, activeSlug, onNavigate }: SpecNavRailProps) {
	const [query, setQuery] = useState("");
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set(findActivePath(tree, activeSlug)));
	const searchId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const filteredTree = useMemo(() => filterNavTree(tree, query), [tree, query]);
	const matchPath = useMemo(() => {
		const paths = new Set<string>();
		function visit(node: NavTreeNode, path: string[]) {
			const nextPath = [...path, node.slug];
			if (node.title.trim().toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) nextPath.forEach((slug) => paths.add(slug));
			node.children?.forEach((child) => visit(child, nextPath));
		}
		if (query.trim()) visit(tree, []);
		return paths;
	}, [query, tree]);

	useEffect(() => {
		const activePath = findActivePath(tree, activeSlug);
		setExpanded((current) => new Set([...current, ...activePath, ...matchPath]));
	}, [activeSlug, matchPath, tree]);

	const resultCount = filteredTree ? Math.max(0, visibleNodeCount(filteredTree) - 1) : 0;
	const clearSearch = () => {
		setQuery("");
		inputRef.current?.focus();
	};
	const toggle = (slug: string) => setExpanded((current) => {
		const next = new Set(current);
		if (next.has(slug)) next.delete(slug); else next.add(slug);
		return next;
	});

	return (
		<nav aria-label="Platform specification" className="spec-nav-rail flex h-full min-h-0 flex-col border-r border-border/80 bg-background">
			<div className="border-b border-border/80 px-3 py-3">
				<p className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Specification</p>
				<label className="relative block" htmlFor={searchId}>
					<span className="sr-only">Search specification</span>
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
					<input ref={inputRef} id={searchId} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" && query) clearSearch(); }} placeholder="Search specification" className="w-full rounded-md border border-border bg-background py-2 pr-8 pl-8 text-sm" />
					{query ? <button type="button" aria-label="Clear search" className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded hover:bg-muted" onClick={clearSearch}><X size={15} aria-hidden /></button> : null}
				</label>
				<p className="mt-2 px-1 text-xs text-muted-foreground" aria-live="polite">{query.trim() ? `${resultCount} result${resultCount === 1 ? "" : "s"}` : "Browse all specifications"}</p>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
				{filteredTree?.children?.length ? <ul role="tree" aria-label="Specification sections" className="space-y-0.5">{filteredTree.children.map((child) => <NavNode key={child.slug} node={child} activeSlug={activeSlug} query={query} expanded={expanded} onToggle={toggle} onNavigate={onNavigate} />)}</ul> : <p className="px-2 py-4 text-sm text-muted-foreground" role="status">No specification sections match “{query.trim()}”.</p>}
			</div>
			<div className="border-t border-border/80 p-3"><Link to="/settings/auth/login" onClick={onNavigate} className="flex w-full items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60">Login</Link></div>
		</nav>
	);
}

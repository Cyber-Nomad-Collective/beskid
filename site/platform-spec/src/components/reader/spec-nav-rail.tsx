"use client";

import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
} from "@beskid/ui-react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import {
	type KeyboardEvent,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	createNavSearchResult,
	findActivePath,
	getVisibleTreeSlugs,
	highlightTitle,
	resolveTreeKey,
	type TreeNavigationKey,
} from "#/components/reader/spec-nav-tree";
import type { OpenSpecNavNode as NavTreeNode } from "#/server/openspec/reader";

interface SpecNavRailContentProps {
	tree: NavTreeNode;
	activeSlug?: string;
	onNavigate?: () => void;
}

function HighlightedTitle({ title, query }: { title: string; query: string }) {
	return highlightTitle(title, query).map((range) =>
		range.match ? (
			<mark
				key={`${range.start}-${range.end}`}
				className="rounded bg-primary/20 px-0.5 text-inherit"
			>
				{title.slice(range.start, range.end)}
			</mark>
		) : (
			<span key={`${range.start}-${range.end}`}>
				{title.slice(range.start, range.end)}
			</span>
		),
	);
}

interface NavNodeProps {
	node: NavTreeNode;
	activeSlug?: string;
	query: string;
	expanded: ReadonlySet<string>;
	focusedSlug?: string;
	onToggle: (slug: string) => void;
	onFocus: (slug: string) => void;
	onKeyDown: (
		event: KeyboardEvent<HTMLAnchorElement>,
		node: NavTreeNode,
	) => void;
	onNavigate?: () => void;
	registerItem: (slug: string, item: HTMLAnchorElement | null) => void;
	depth?: number;
}

function NavNode({
	node,
	activeSlug,
	query,
	expanded,
	focusedSlug,
	onToggle,
	onFocus,
	onKeyDown,
	onNavigate,
	registerItem,
	depth = 0,
}: NavNodeProps) {
	const isActive = activeSlug === node.slug;
	const hasChildren = Boolean(node.children?.length);
	const isExpanded = expanded.has(node.slug);
	const paddingLeft = `${0.5 + depth * 0.75}rem`;
	const itemRef = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		if (isActive) itemRef.current?.scrollIntoView({ block: "nearest" });
	}, [isActive]);

	return (
		<li role="none">
			<div className="flex items-center" style={{ paddingLeft }}>
				{hasChildren ? (
					<button
						type="button"
						tabIndex={-1}
						className="flex size-7 shrink-0 items-center justify-center rounded hover:bg-muted"
						aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.title}`}
						onClick={() => {
							itemRef.current?.focus();
							onFocus(node.slug);
							onToggle(node.slug);
						}}
					>
						{isExpanded ? (
							<ChevronDown size={16} aria-hidden />
						) : (
							<ChevronRight size={16} aria-hidden />
						)}
					</button>
				) : (
					<span className="inline-block size-7 shrink-0" aria-hidden />
				)}
				<Link
					ref={(item) => {
						itemRef.current = item;
						registerItem(node.slug, item);
					}}
					data-spec-tree-slug={node.slug}
					to={node.href}
					role="treeitem"
					aria-level={depth + 1}
					aria-expanded={hasChildren ? isExpanded : undefined}
					aria-selected={isActive}
					tabIndex={focusedSlug === node.slug ? 0 : -1}
					className={[
						"min-w-0 flex-1 rounded-md px-2 py-1.5 text-sm transition-colors",
						isActive
							? "bg-primary/15 font-medium text-primary"
							: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
					].join(" ")}
					onFocus={() => onFocus(node.slug)}
					onClick={onNavigate}
					onKeyDown={(event) => onKeyDown(event, node)}
				>
					<HighlightedTitle title={node.title} query={query} />
				</Link>
			</div>
			{hasChildren && isExpanded ? (
				<ul role="group" className="space-y-0.5">
					{node.children?.map((child) => (
						<NavNode
							key={child.slug}
							node={child}
							activeSlug={activeSlug}
							query={query}
							expanded={expanded}
							focusedSlug={focusedSlug}
							onToggle={onToggle}
							onFocus={onFocus}
							onKeyDown={onKeyDown}
							onNavigate={onNavigate}
							registerItem={registerItem}
							depth={depth + 1}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
}

export function SpecNavRailContent({
	tree,
	activeSlug,
	onNavigate,
}: SpecNavRailContentProps) {
	const [query, setQuery] = useState("");
	const activePath = useMemo(
		() => findActivePath(tree, activeSlug),
		[tree, activeSlug],
	);
	const [userExpanded, setUserExpanded] = useState<Set<string>>(
		() => new Set(activePath),
	);
	const searchId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
	const searchResult = useMemo(
		() => createNavSearchResult(tree, query),
		[tree, query],
	);
	useEffect(() => {
		setUserExpanded((current) => new Set([...current, ...activePath]));
	}, [activePath]);
	const effectiveExpanded = useMemo(
		() =>
			new Set([
				...userExpanded,
				...(query.trim() ? searchResult.expandedSlugs : []),
			]),
		[userExpanded, query, searchResult.expandedSlugs],
	);
	const visibleSlugs = useMemo(
		() =>
			searchResult.tree
				? getVisibleTreeSlugs(searchResult.tree, effectiveExpanded)
				: [],
		[searchResult.tree, effectiveExpanded],
	);
	const [focusedSlug, setFocusedSlug] = useState<string | undefined>(
		() => activePath.at(-1) ?? tree.children?.[0]?.slug,
	);
	const shouldMoveDomFocus = useRef(false);

	useEffect(() => {
		if (!focusedSlug || !visibleSlugs.includes(focusedSlug)) {
			setFocusedSlug(
				(activeSlug && visibleSlugs.includes(activeSlug)
					? activeSlug
					: undefined) ?? visibleSlugs[0],
			);
		}
	}, [activeSlug, focusedSlug, visibleSlugs]);

	useEffect(() => {
		if (!shouldMoveDomFocus.current || !focusedSlug) return;
		shouldMoveDomFocus.current = false;
		itemRefs.current.get(focusedSlug)?.focus();
	}, [focusedSlug, effectiveExpanded]);

	const focusItem = (slug: string) => {
		shouldMoveDomFocus.current = true;
		setFocusedSlug(slug);
	};
	const clearSearch = () => {
		setQuery("");
		inputRef.current?.focus();
	};
	const toggle = (slug: string) =>
		setUserExpanded((current) => {
			const next = new Set(current);
			if (next.has(slug)) next.delete(slug);
			else next.add(slug);
			return next;
		});
	const registerItem = (slug: string, item: HTMLAnchorElement | null) => {
		if (item) itemRefs.current.set(slug, item);
		else itemRefs.current.delete(slug);
	};
	const handleTreeKey = (
		event: KeyboardEvent<HTMLAnchorElement>,
		node: NavTreeNode,
	) => {
		if (event.key === "Escape" && query) {
			event.preventDefault();
			event.stopPropagation();
			clearSearch();
			return;
		}
		const supportedKeys: TreeNavigationKey[] = [
			"ArrowDown",
			"ArrowUp",
			"ArrowLeft",
			"ArrowRight",
			"Home",
			"End",
			"Enter",
		];
		if (
			!supportedKeys.includes(event.key as TreeNavigationKey) ||
			!searchResult.tree
		)
			return;
		const decision = resolveTreeKey(
			searchResult.tree,
			effectiveExpanded,
			node.slug,
			event.key as TreeNavigationKey,
		);
		if (!decision) return;
		event.preventDefault();
		if ("focusSlug" in decision) focusItem(decision.focusSlug);
		else if ("expandSlug" in decision) {
			setUserExpanded((current) => new Set([...current, decision.expandSlug]));
		} else if ("collapseSlug" in decision) {
			setUserExpanded((current) => {
				const next = new Set(current);
				next.delete(decision.collapseSlug);
				return next;
			});
		} else if (decision.activate) event.currentTarget.click();
	};

	return (
		<>
			<SidebarHeader className="border-b border-sidebar-border">
				<SidebarGroup>
					<SidebarGroupContent>
						<p className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Specification
						</p>
						<label className="relative block" htmlFor={searchId}>
							<span className="sr-only">Search specification</span>
							<Search
								className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
								aria-hidden
							/>
							<input
								ref={inputRef}
								id={searchId}
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Escape" && query) {
										event.preventDefault();
										event.stopPropagation();
										clearSearch();
									}
								}}
								placeholder="Search specification"
								className="w-full rounded-md border border-border bg-background py-2 pr-8 pl-8 text-sm"
							/>
							{query ? (
								<button
									type="button"
									aria-label="Clear search"
									className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded hover:bg-muted"
									onClick={clearSearch}
								>
									<X size={15} aria-hidden />
								</button>
							) : null}
						</label>
						<p className="mt-2 px-1 text-xs text-muted-foreground" aria-live="polite">
							{query.trim()
								? `${searchResult.matchCount} result${searchResult.matchCount === 1 ? "" : "s"}`
								: "Browse all specifications"}
						</p>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarHeader>
			<SidebarContent>
				<div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
					{searchResult.tree?.children?.length ? (
						<ul
							role="tree"
							aria-label="Specification sections"
							className="space-y-0.5"
						>
							{searchResult.tree.children.map((child) => (
								<NavNode
									key={child.slug}
									node={child}
									activeSlug={activeSlug}
									query={query}
									expanded={effectiveExpanded}
									focusedSlug={focusedSlug}
									onToggle={toggle}
									onFocus={setFocusedSlug}
									onKeyDown={handleTreeKey}
									onNavigate={onNavigate}
									registerItem={registerItem}
								/>
							))}
						</ul>
					) : (
						<p className="px-2 py-4 text-sm text-muted-foreground" role="status">
							No specification sections match “{query.trim()}”.
						</p>
					)}
				</div>
			</SidebarContent>
		</>
	);
}

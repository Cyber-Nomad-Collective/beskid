import type { GraphNode } from "gitnexus-shared";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "@/lib/lucide-icons";
import { useAppState } from "../hooks/useAppState";
import { CodeReferencesPanel } from "./CodeReferencesPanel";
import { FileTreePanel } from "./FileTreePanel";
import { GraphCanvas, type GraphCanvasHandle } from "./GraphCanvas";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { StatusBar } from "./StatusBar";
import { type StandardLink, StandardLinks } from "./standard-links";

const NODE_TYPE_COLORS: Record<string, string> = {
	Folder: "#6366f1",
	File: "#3b82f6",
	Function: "#10b981",
	Class: "#f59e0b",
	Method: "#14b8a6",
	Interface: "#ec4899",
	Variable: "#64748b",
	Import: "#475569",
	Type: "#a78bfa",
};

function NodeDocumentationPanel() {
	const { selectedNode } = useAppState();

	const codeDoc = selectedNode?.properties?.codeDoc as string | undefined;
	const specLinks = selectedNode?.properties?.specLinks as
		| StandardLink[]
		| undefined;
	const hasSpecLinks = Array.isArray(specLinks) && specLinks.length > 0;

	if (!selectedNode || (!codeDoc && !hasSpecLinks)) {
		return null;
	}

	return (
		<aside className="pointer-events-auto absolute top-4 right-4 z-40 flex max-h-[min(60vh,520px)] w-80 flex-col overflow-hidden rounded-xl bg-card/95 shadow-2xl backdrop-blur-md">
			{codeDoc ? (
				<section className="px-4 py-3">
					<h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Code documentation
					</h3>
					<MarkdownRenderer content={codeDoc} />
				</section>
			) : null}

			{hasSpecLinks ? (
				<section className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-3">
					<h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Platform spec
					</h3>
					<StandardLinks links={specLinks!} />
				</section>
			) : null}
		</aside>
	);
}

export interface SymbolSearchProps {
	onFocusNode: (nodeId: string) => void;
}

export function SymbolSearch({ onFocusNode }: SymbolSearchProps) {
	const { graph } = useAppState();
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const searchRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const searchResults = useMemo(() => {
		if (!graph || !searchQuery.trim()) return [];
		const q = searchQuery.toLowerCase();
		return graph.nodes
			.filter((node) => {
				const name = (node.properties.name as string) || "";
				const path = (node.properties.filePath as string) || "";
				return name.toLowerCase().includes(q) || path.toLowerCase().includes(q);
			})
			.slice(0, 12);
	}, [graph, searchQuery]);

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			if (
				searchRef.current &&
				event.target instanceof Node &&
				!searchRef.current.contains(event.target)
			) {
				setIsSearchOpen(false);
			}
		};
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, []);

	const selectNode = (node: GraphNode) => {
		onFocusNode(node.id);
		setSearchQuery("");
		setIsSearchOpen(false);
	};

	return (
		<div ref={searchRef} className="relative hidden sm:block">
			<div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1">
				<Search className="h-4 w-4 text-muted-foreground" />
				<input
					ref={inputRef}
					type="search"
					placeholder="Search symbols…"
					className="w-40 bg-transparent text-sm outline-none md:w-56"
					value={searchQuery}
					onChange={(event) => {
						setSearchQuery(event.target.value);
						setIsSearchOpen(true);
						setSelectedIndex(0);
					}}
					onFocus={() => setIsSearchOpen(true)}
					onKeyDown={(event) => {
						if (!isSearchOpen || searchResults.length === 0) return;
						if (event.key === "ArrowDown") {
							event.preventDefault();
							setSelectedIndex((index) =>
								Math.min(index + 1, searchResults.length - 1),
							);
						} else if (event.key === "ArrowUp") {
							event.preventDefault();
							setSelectedIndex((index) => Math.max(index - 1, 0));
						} else if (event.key === "Enter") {
							event.preventDefault();
							selectNode(searchResults[selectedIndex]!);
						} else if (event.key === "Escape") {
							setIsSearchOpen(false);
						}
					}}
				/>
			</div>
			{isSearchOpen && searchResults.length > 0 ? (
				<ul className="absolute right-0 z-50 mt-1 max-h-72 w-72 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg">
					{searchResults.map((node, index) => (
						<li key={node.id}>
							<button
								type="button"
								className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted ${
									index === selectedIndex ? "bg-primary/10" : ""
								}`}
								onClick={() => selectNode(node)}
							>
								<span
									className="font-medium"
									style={{ color: NODE_TYPE_COLORS[node.label] ?? "#94a3b8" }}
								>
									{node.properties.name as string}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{node.properties.filePath as string}
								</span>
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

export interface GraphExplorerLayoutProps {
	graphCanvasRef: RefObject<GraphCanvasHandle | null>;
	onFocusNode: (nodeId: string) => void;
	serverDisconnected?: boolean;
}

export function GraphExplorerLayout({
	graphCanvasRef,
	onFocusNode,
	serverDisconnected,
}: GraphExplorerLayoutProps) {
	const { isCodePanelOpen, codeReferences, selectedNode } = useAppState();

	return (
		<>
			<main className="flex min-h-0 flex-1">
				<FileTreePanel onFocusNode={onFocusNode} />

				<div className="relative min-w-0 flex-1">
					<GraphCanvas ref={graphCanvasRef} />

					{isCodePanelOpen && (codeReferences.length > 0 || !!selectedNode) ? (
						<div className="pointer-events-auto absolute inset-y-0 left-0 z-30">
							<CodeReferencesPanel onFocusNode={onFocusNode} />
						</div>
					) : null}

					<NodeDocumentationPanel />
				</div>
			</main>

			<StatusBar />

			{serverDisconnected ? (
				<div className="fixed bottom-12 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-yellow-500/30 bg-yellow-900/80 px-4 py-2 text-sm text-yellow-200 shadow-lg backdrop-blur">
					Server connection lost — reconnecting…
				</div>
			) : null}
		</>
	);
}

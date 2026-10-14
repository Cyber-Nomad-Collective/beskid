import { cn } from "@cyber-nomad-collective/beskid-ui-react";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
	type ApiIndex,
	breadcrumbs,
	buildNavTree,
	displayName,
	kindLabel,
	type NavNode,
} from "#/lib/api-docs";
import type { ApiDocItem } from "#/lib/pckg-api";

const KIND_GLYPH: Record<string, string> = {
	module: "{ }",
	type: "T",
	enum: "E",
	contract: "C",
	function: "ƒ",
};

/**
 * Left-hand namespace tree (modules expand to their types, enums, contracts
 * and functions), in the style of docs.rs / learn.microsoft.com reference
 * navigation. Expands automatically to the selected item.
 */
export function ApiNav({
	index,
	selected,
	onSelect,
	filter,
}: {
	index: ApiIndex;
	selected: ApiDocItem | null;
	onSelect: (item: ApiDocItem) => void;
	filter: string;
}) {
	const tree = useMemo(() => buildNavTree(index), [index]);
	const selectedChain = useMemo(
		() =>
			new Set(
				selected
					? breadcrumbs(index, selected).map((item) => item.id as number)
					: [],
			),
		[index, selected],
	);
	const [toggled, setToggled] = useState<Map<number, boolean>>(new Map());
	const needle = filter.trim().toLowerCase();

	const isOpen = (node: NavNode) => {
		const id = node.item.id as number;
		if (needle) return true;
		return toggled.get(id) ?? selectedChain.has(id);
	};
	const matches = (node: NavNode): boolean =>
		!needle ||
		displayName(node.item).toLowerCase().includes(needle) ||
		node.item.qualifiedName.toLowerCase().includes(needle) ||
		node.children.some(matches);

	const render = (node: NavNode, depth: number) => {
		if (!matches(node)) return null;
		const id = node.item.id as number;
		const open = isOpen(node);
		const active = selected?.id === id;
		const hasChildren = node.children.length > 0;
		return (
			<li key={id}>
				<div
					className={cn(
						"flex items-center gap-1 rounded-md pr-2 text-sm",
						active ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
					)}
					style={{ paddingLeft: `${depth * 0.75}rem` }}
				>
					<button
						type="button"
						aria-label={hasChildren ? (open ? "Collapse" : "Expand") : undefined}
						className={cn(
							"flex size-6 shrink-0 items-center justify-center",
							!hasChildren && "invisible",
						)}
						onClick={() => setToggled((previous) => new Map(previous).set(id, !open))}
					>
						<ChevronRight
							className={cn(
								"size-3.5 text-muted-foreground transition-transform",
								open && "rotate-90",
							)}
						/>
					</button>
					<button
						type="button"
						className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
						onClick={() => onSelect(node.item)}
						aria-current={active ? "page" : undefined}
					>
						<span
							className="w-6 shrink-0 text-center font-mono text-[10px] text-muted-foreground"
							title={kindLabel(node.item.kind)}
						>
							{KIND_GLYPH[node.item.kind] ?? "·"}
						</span>
						<span className="truncate">{displayName(node.item)}</span>
					</button>
				</div>
				{hasChildren && open && (
					<ul>{node.children.map((child) => render(child, depth + 1))}</ul>
				)}
			</li>
		);
	};

	return (
		<nav aria-label="API reference navigation">
			<ul className="space-y-0.5">{tree.map((node) => render(node, 0))}</ul>
			{tree.length === 0 && (
				<p className="px-2 text-sm text-muted-foreground">No public items.</p>
			)}
		</nav>
	);
}

import type { ApiDocItem, ApiDocRoot } from "./pckg-api";

/**
 * Read model over a package's `api.json` (schema v4, `graph-v1` navigation).
 *
 * Navigation is built strictly from `parentId` / `memberIds` edges as the
 * schema demands; `qualifiedName` is never split. The shapes below drive the
 * reference layout: a module tree on the left, one page per module / type /
 * enum / contract / function, member tables grouped like .NET API reference
 * (Fields, Variants, Methods, Functions, Nested types) and a right-hand outline.
 */

export type ItemId = number;

export interface ApiIndex {
	root: ApiDocRoot;
	byId: Map<ItemId, ApiDocItem>;
	children: Map<ItemId, ApiDocItem[]>;
	roots: ApiDocItem[];
	/** Functions whose first parameter refers to a type, keyed by that type id. */
	methodsByReceiver: Map<ItemId, ApiDocItem[]>;
}

/** Kinds that get a page of their own. */
export const PAGE_KINDS = new Set([
	"module",
	"type",
	"enum",
	"contract",
	"function",
]);

const TYPE_LIKE = new Set(["type", "enum", "contract"]);

export function buildApiIndex(root: ApiDocRoot): ApiIndex {
	const byId = new Map<ItemId, ApiDocItem>();
	for (const item of root.items) {
		if (typeof item.id === "number") byId.set(item.id, item);
	}
	const children = new Map<ItemId, ApiDocItem[]>();
	const roots: ApiDocItem[] = [];
	for (const item of root.items) {
		if (typeof item.id !== "number") continue;
		if (typeof item.parentId === "number" && byId.has(item.parentId)) {
			const siblings = children.get(item.parentId) ?? [];
			siblings.push(item);
			children.set(item.parentId, siblings);
		} else {
			roots.push(item);
		}
	}
	for (const [parentId, items] of children) {
		const parent = byId.get(parentId);
		if (parent?.memberIds?.length) {
			const order = new Map(parent.memberIds.map((id, index) => [id, index]));
			items.sort(
				(left, right) =>
					(order.get(left.id as number) ?? 1e9) -
					(order.get(right.id as number) ?? 1e9),
			);
		}
	}
	const methodsByReceiver = new Map<ItemId, ApiDocItem[]>();
	for (const item of root.items) {
		if (item.kind !== "function") continue;
		const receiver = item.parameters?.[0]?.type.refItemId;
		if (typeof receiver !== "number") continue;
		const receiverItem = byId.get(receiver);
		if (!receiverItem || !TYPE_LIKE.has(receiverItem.kind)) continue;
		const methods = methodsByReceiver.get(receiver) ?? [];
		methods.push(item);
		methodsByReceiver.set(receiver, methods);
	}
	return { root, byId, children, roots, methodsByReceiver };
}

export function isUserFacing(item: ApiDocItem): boolean {
	return !item.name.startsWith("__") && item.visibility !== "private";
}

export function displayName(item: ApiDocItem): string {
	return item.displayName ?? item.name;
}

/** First paragraph of the structured or raw doc, for member tables. */
export function summaryOf(item: ApiDocItem): string {
	const text = item.doc?.summaryMarkdown ?? item.docMarkdown ?? "";
	const paragraph = text.split(/\n\s*\n/)[0] ?? "";
	return paragraph
		.split("\n")
		.filter((line) => !line.trim().startsWith("@"))
		.join(" ")
		.trim();
}

/** Remarks are the doc body after the summary paragraph, minus directives. */
export function remarksOf(item: ApiDocItem): string {
	const text = item.docMarkdown ?? "";
	const [, ...rest] = text.split(/\n\s*\n/);
	return rest
		.join("\n\n")
		.split("\n")
		.filter((line) => !line.trim().startsWith("@"))
		.join("\n")
		.replace(
			/\*\*(Parameter|Returns|Type parameter|Variant)[^*]*\*\*[\s\S]*$/,
			"",
		)
		.replace(/```[\s\S]*?```/g, "")
		.trim();
}

/** Returns the first fenced code block from the doc as the example section. */
export function exampleOf(item: ApiDocItem): string | null {
	const text = item.docMarkdown ?? "";
	const match = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
	return match ? (match[1] ?? "").trimEnd() : null;
}

export interface NavNode {
	item: ApiDocItem;
	children: NavNode[];
}

/** Module tree for the left navigation; pages hang under their module. */
export function buildNavTree(index: ApiIndex): NavNode[] {
	const visit = (item: ApiDocItem): NavNode | null => {
		if (!PAGE_KINDS.has(item.kind) || !isUserFacing(item)) return null;
		const children = (index.children.get(item.id as number) ?? [])
			.map(visit)
			.filter((node): node is NavNode => node !== null);
		if (item.kind === "module") {
			children.sort(compareNav);
		}
		return { item, children };
	};
	return index.roots
		.map(visit)
		.filter((node): node is NavNode => node !== null)
		.sort(compareNav);
}

const KIND_RANK: Record<string, number> = {
	module: 0,
	contract: 1,
	type: 2,
	enum: 3,
	function: 4,
};

function compareNav(left: NavNode, right: NavNode): number {
	const rank =
		(KIND_RANK[left.item.kind] ?? 9) - (KIND_RANK[right.item.kind] ?? 9);
	return rank !== 0
		? rank
		: displayName(left.item).localeCompare(displayName(right.item), "en");
}

export interface MemberGroup {
	id: string;
	title: string;
	items: ApiDocItem[];
}

const GROUP_TITLES: Array<[kind: string, id: string, title: string]> = [
	["contract", "contracts", "Contracts"],
	["type", "types", "Types"],
	["enum", "enums", "Enums"],
	["function", "functions", "Functions"],
	["field", "fields", "Fields"],
	["enum_variant", "variants", "Variants"],
	["contract_method", "methods", "Methods"],
	["module", "modules", "Modules"],
	["test", "tests", "Tests"],
];

/** Member tables for a page: direct children by kind, plus receiver methods. */
export function memberGroups(index: ApiIndex, item: ApiDocItem): MemberGroup[] {
	const children = (index.children.get(item.id as number) ?? []).filter(
		(child) => child.kind !== "parameter" && isUserFacing(child),
	);
	const groups: MemberGroup[] = [];
	for (const [kind, id, title] of GROUP_TITLES) {
		const items = children.filter((child) => child.kind === kind);
		if (items.length > 0) groups.push({ id, title, items });
	}
	if (TYPE_LIKE.has(item.kind)) {
		const methods = (index.methodsByReceiver.get(item.id as number) ?? []).filter(
			isUserFacing,
		);
		if (methods.length > 0)
			groups.push({ id: "receiver-methods", title: "Methods", items: methods });
	}
	return groups;
}

export interface OutlineEntry {
	id: string;
	title: string;
}

/** "In this article" entries, in page order. */
export function outlineFor(index: ApiIndex, item: ApiDocItem): OutlineEntry[] {
	const entries: OutlineEntry[] = [];
	if (item.signature) entries.push({ id: "definition", title: "Definition" });
	if (item.kind === "function") {
		if (item.genericParameters?.length)
			entries.push({ id: "type-parameters", title: "Type parameters" });
		if (item.parameters?.length)
			entries.push({ id: "parameters", title: "Parameters" });
		if (item.returnType) entries.push({ id: "returns", title: "Returns" });
	}
	if (remarksOf(item)) entries.push({ id: "remarks", title: "Remarks" });
	if (exampleOf(item)) entries.push({ id: "examples", title: "Examples" });
	for (const group of memberGroups(index, item))
		entries.push({ id: group.id, title: group.title });
	entries.push({ id: "source", title: "Source" });
	return entries;
}

/** Breadcrumb from the root module down to the item. */
export function breadcrumbs(index: ApiIndex, item: ApiDocItem): ApiDocItem[] {
	const chain: ApiDocItem[] = [];
	let current: ApiDocItem | undefined = item;
	const seen = new Set<number>();
	while (current) {
		if (typeof current.id === "number") {
			if (seen.has(current.id)) break;
			seen.add(current.id);
		}
		chain.unshift(current);
		current =
			typeof current.parentId === "number"
				? index.byId.get(current.parentId)
				: undefined;
	}
	return chain;
}

/** Page to open when no item is selected: the first user-facing root module. */
export function defaultPage(index: ApiIndex): ApiDocItem | null {
	const tree = buildNavTree(index);
	return tree[0]?.item ?? null;
}

/** Resolves `?item=` which may be a numeric id or a symbolKey / qualifiedName. */
export function resolveItem(
	index: ApiIndex,
	selector: string,
): ApiDocItem | null {
	if (!selector) return null;
	if (/^\d+$/.test(selector)) return index.byId.get(Number(selector)) ?? null;
	return (
		index.root.items.find((item) => item.symbolKey === selector) ??
		index.root.items.find((item) => item.qualifiedName === selector) ??
		null
	);
}

export function itemSelector(item: ApiDocItem): string {
	return item.symbolKey ?? item.qualifiedName;
}

export const KIND_LABELS: Record<string, string> = {
	module: "Module",
	type: "Type",
	enum: "Enum",
	contract: "Contract",
	function: "Function",
	field: "Field",
	enum_variant: "Variant",
	contract_method: "Method",
	parameter: "Parameter",
	test: "Test",
};

export function kindLabel(kind: string): string {
	return KIND_LABELS[kind] ?? kind;
}

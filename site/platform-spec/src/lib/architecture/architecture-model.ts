export type ArchitectureState =
	| "current"
	| "transitional"
	| "retiring"
	| "target"
	| "derived";

export type ArchitectureNodeKind =
	| "authority"
	| "evidence"
	| "source"
	| "manifest"
	| "package"
	| "process"
	| "representation"
	| "tool"
	| "runtime"
	| "artifact";

export type ArchitectureEdgeKind =
	| "governs"
	| "evidences"
	| "declares"
	| "resolves"
	| "parses"
	| "derives"
	| "transforms"
	| "verifies"
	| "packages"
	| "executes"
	| "supports";

export interface ArchitectureGroup {
	id: string;
	label: string;
	description: string;
}

export interface ArchitectureNode {
	id: string;
	label: string;
	description: string;
	group: string;
	kind: ArchitectureNodeKind;
	state: ArchitectureState;
	specKeys: readonly string[];
	sourcePaths: readonly string[];
	tags?: readonly string[];
	metadata?: Readonly<Record<string, string>>;
}

export interface ArchitectureEdge {
	id: string;
	from: string;
	to: string;
	kind: ArchitectureEdgeKind;
	label: string;
	description: string;
	state: ArchitectureState;
	specKeys?: readonly string[];
	sourcePaths?: readonly string[];
}

export interface ArchitectureManifest {
	groups: readonly ArchitectureGroup[];
	nodes: readonly ArchitectureNode[];
	edges: readonly ArchitectureEdge[];
	traversals: Readonly<Record<"build" | "ide" | "spec-to-code", readonly string[]>>;
}

export interface ArchitectureSpecLink {
	capability: string;
	title?: string;
	href?: string;
	available: boolean;
}

export interface ResolvedArchitectureNode extends ArchitectureNode {
	specLinks: readonly ArchitectureSpecLink[];
}

export interface ResolvedArchitectureModel {
	groups: readonly ArchitectureGroup[];
	nodes: readonly ResolvedArchitectureNode[];
	nodesById: Readonly<Record<string, ResolvedArchitectureNode>>;
	edges: readonly ArchitectureEdge[];
	adjacency: Readonly<Record<string, readonly string[]>>;
	traversals: ArchitectureManifest["traversals"];
}

export interface ArchitectureCatalogEntry {
	capability: string;
	href: string;
	title: string;
}

function resolveSpecLinks(
	node: ArchitectureNode,
	catalogByCapability: ReadonlyMap<string, ArchitectureCatalogEntry>,
): readonly ArchitectureSpecLink[] {
	return node.specKeys.map((capability) => {
		const entry = catalogByCapability.get(capability);
		if (entry) {
			return { capability, href: entry.href, title: entry.title, available: true };
		}
		if (node.state === "current") {
			throw new Error(`unresolved current spec key "${capability}" on node "${node.id}"`);
		}
		return { capability, available: false };
	});
}

export function resolveArchitectureModel(
	manifest: ArchitectureManifest,
	catalogEntries: readonly ArchitectureCatalogEntry[],
): ResolvedArchitectureModel {
	const groupIds = new Set<string>();
	for (const group of manifest.groups) {
		if (groupIds.has(group.id)) throw new Error(`duplicate group ID "${group.id}"`);
		groupIds.add(group.id);
	}

	const catalogByCapability = new Map(catalogEntries.map((entry) => [entry.capability, entry]));
	const nodesById: Record<string, ResolvedArchitectureNode> = {};
	for (const node of manifest.nodes) {
		if (nodesById[node.id]) throw new Error(`duplicate node ID "${node.id}"`);
		if (!groupIds.has(node.group)) throw new Error(`unknown group "${node.group}" on node "${node.id}"`);
		nodesById[node.id] = { ...node, specLinks: resolveSpecLinks(node, catalogByCapability) };
	}

	const edgeIds = new Set<string>();
	const adjacency: Record<string, string[]> = Object.fromEntries(
		Object.keys(nodesById).map((id) => [id, []]),
	);
	for (const edge of manifest.edges) {
		if (edgeIds.has(edge.id)) throw new Error(`duplicate edge ID "${edge.id}"`);
		edgeIds.add(edge.id);
		if (!nodesById[edge.from]) throw new Error(`edge "${edge.id}" has unknown node "${edge.from}"`);
		if (!nodesById[edge.to]) throw new Error(`edge "${edge.id}" has unknown node "${edge.to}"`);
		adjacency[edge.from]!.push(edge.to);
		adjacency[edge.to]!.push(edge.from);
	}

	for (const [name, traversal] of Object.entries(manifest.traversals)) {
		for (const nodeId of traversal) {
			if (!nodesById[nodeId]) throw new Error(`traversal "${name}" has unknown node "${nodeId}"`);
		}
	}

	return {
		groups: manifest.groups,
		nodes: Object.values(nodesById),
		nodesById,
		edges: manifest.edges,
		adjacency,
		traversals: manifest.traversals,
	};
}

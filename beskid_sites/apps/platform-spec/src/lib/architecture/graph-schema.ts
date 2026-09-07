/**
 * Author-defined architecture graph schema.
 *
 * A simplified, embeddable counterpart to the full {@link ArchitectureManifest}.
 * Spec authors can define these inline in markdown (via the `graph` directive)
 * or as standalone JSON served from `data/derived/architecture/{key}.json`.
 *
 * The full manifest is the canonical compiler architecture source of truth;
 * this schema is the author-facing primitive for embedding architecture graph
 * sections in spec content.
 */

export interface AuthorGraphNode {
	id: string;
	label: string;
	description?: string;
	/** "process" | "representation" | "artifact" | "package" | "tool" | etc. */
	kind: string;
	/** Optional group label / group id. */
	group?: string;
	/** Optional OpenSpec capability ID. */
	specKey?: string;
	/** Optional repo-relative source path. */
	sourcePath?: string;
}

export interface AuthorGraphEdge {
	id: string;
	from: string;
	to: string;
	/** "transforms" | "derives" | "parses" | etc. */
	kind: string;
	label?: string;
}

export interface AuthorGraphGroup {
	id: string;
	label: string;
}

export interface AuthorArchitectureGraph {
	id: string;
	title: string;
	description?: string;
	groups: AuthorGraphGroup[];
	nodes: AuthorGraphNode[];
	edges: AuthorGraphEdge[];
	/** "auto" = dagre layout, "manual" = author provides positions. */
	layout?: "auto" | "manual";
	/** Node positions for manual layout, keyed by node id. */
	positions?: Record<string, { x: number; y: number }>;
}

/** Default node kind when omitted in the inline directive format. */
export const DEFAULT_NODE_KIND = "process";

/** Default edge kind when omitted in the inline directive format. */
export const DEFAULT_EDGE_KIND = "transforms";

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Parse a comma-separated node spec (`id:label:kind`) into author nodes.
 *
 * - `scheduler` → id=scheduler, label=scheduler, kind=process
 * - `fiber:Channel` → id=fiber, label=Channel, kind=process
 * - `gc:GC:process` → id=gc, label=GC, kind=process
 */
export function parseInlineNodes(spec: string): AuthorGraphNode[] {
	return splitCommas(spec).map((token) => {
		const parts = token.split(":");
		const id = (parts[0] ?? "").trim();
		const label = (parts[1] ?? "").trim() || id;
		const kind = (parts[2] ?? "").trim() || DEFAULT_NODE_KIND;
		return { id, label, kind };
	});
}

/**
 * Parse a comma-separated edge spec (`from->to:kind:label`) into author edges.
 *
 * - `scheduler->fiber:spawns` → from=scheduler, to=fiber, kind=spawns
 * - `fiber->channel:reads` → from=fiber, to=channel, kind=reads
 * - `fiber->gc:roots` → from=fiber, to=gc, kind=roots
 */
export function parseInlineEdges(spec: string): AuthorGraphEdge[] {
	const tokens = splitCommas(spec);
	const counts = new Map<string, number>();
	return tokens.map((token) => {
		const arrowIndex = token.indexOf("->");
		const from = (arrowIndex >= 0 ? token.slice(0, arrowIndex) : token).trim();
		const rest = arrowIndex >= 0 ? token.slice(arrowIndex + 2) : "";
		const parts = rest.split(":");
		const to = (parts[0] ?? "").trim();
		const kind = (parts[1] ?? "").trim() || DEFAULT_EDGE_KIND;
		const label = (parts[2] ?? "").trim() || undefined;
		const baseId = `${from}-to-${to}`;
		const count = counts.get(baseId) ?? 0;
		counts.set(baseId, count + 1);
		const id = count === 0 ? baseId : `${baseId}-${count}`;
		return { id, from, to, kind, label };
	});
}

function splitCommas(spec: string): string[] {
	return spec
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Build an {@link AuthorArchitectureGraph} from parsed directive fields.
 *
 * Returns `null` when neither `nodes` nor `edges` are present (i.e. the
 * directive is a ref-based graph, not an inline author graph).
 */
export function parseInlineGraph(
	fields: Record<string, string>,
): AuthorArchitectureGraph | null {
	if (!fields.nodes && !fields.edges) return null;
	const title = fields.title ?? "Architecture graph";
	const id = fields.id ?? (slugify(title) || "architecture-graph");
	const nodes = parseInlineNodes(fields.nodes ?? "");
	const edges = parseInlineEdges(fields.edges ?? "");
	const description = fields.description || undefined;
	return {
		id,
		title,
		description,
		groups: [],
		nodes,
		edges,
		layout: "auto",
	};
}

/**
 * Coerce an unknown JSON payload (from the API or a BSOL document) into an
 * {@link AuthorArchitectureGraph}. Handles both the author graph schema and
 * the full {@link ArchitectureManifest} shape.
 *
 * Returns `null` when the payload is not a recognizable graph.
 */
export function coerceAuthorGraph(
	raw: unknown,
): AuthorArchitectureGraph | null {
	if (typeof raw !== "object" || raw === null) return null;
	const obj = raw as Record<string, unknown>;
	if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) return null;

	const id =
		typeof obj.id === "string"
			? obj.id
			: typeof obj.title === "string"
				? slugify(obj.title) || "architecture-graph"
				: "architecture-graph";
	const title = typeof obj.title === "string" ? obj.title : "Architecture graph";
	const description =
		typeof obj.description === "string" ? obj.description : undefined;

	const groups = coerceGroups(obj.groups);
	const nodes = (obj.nodes as unknown[])
		.map(coerceNode)
		.filter(Boolean) as AuthorGraphNode[];
	const edges = (obj.edges as unknown[])
		.map(coerceEdge)
		.filter(Boolean) as AuthorGraphEdge[];

	const layout =
		obj.layout === "manual" || obj.layout === "auto" ? obj.layout : "auto";
	const positions = coercePositions(obj.positions);

	return { id, title, description, groups, nodes, edges, layout, positions };
}

function coerceGroups(raw: unknown): AuthorGraphGroup[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((entry) => {
			if (typeof entry !== "object" || entry === null) return null;
			const e = entry as Record<string, unknown>;
			const id = typeof e.id === "string" ? e.id : "";
			const label =
				typeof e.label === "string" ? e.label : typeof id === "string" ? id : "";
			return id ? { id, label } : null;
		})
		.filter(Boolean) as AuthorGraphGroup[];
}

function coerceNode(raw: unknown): AuthorGraphNode | null {
	if (typeof raw !== "object" || raw === null) return null;
	const e = raw as Record<string, unknown>;
	const id = typeof e.id === "string" ? e.id : "";
	if (!id) return null;
	const label = typeof e.label === "string" ? e.label : id;
	const kind = typeof e.kind === "string" ? e.kind : DEFAULT_NODE_KIND;
	const description =
		typeof e.description === "string" ? e.description : undefined;
	const group = typeof e.group === "string" ? e.group : undefined;
	const specKey =
		typeof e.specKey === "string"
			? e.specKey
			: Array.isArray(e.specKeys) && typeof e.specKeys[0] === "string"
				? (e.specKeys[0] as string)
				: undefined;
	const sourcePath =
		typeof e.sourcePath === "string"
			? e.sourcePath
			: Array.isArray(e.sourcePaths) && typeof e.sourcePaths[0] === "string"
				? (e.sourcePaths[0] as string)
				: undefined;
	return { id, label, description, kind, group, specKey, sourcePath };
}

function coerceEdge(raw: unknown): AuthorGraphEdge | null {
	if (typeof raw !== "object" || raw === null) return null;
	const e = raw as Record<string, unknown>;
	const id = typeof e.id === "string" ? e.id : "";
	const from =
		typeof e.from === "string"
			? e.from
			: typeof e.source === "string"
				? e.source
				: "";
	const to =
		typeof e.to === "string"
			? e.to
			: typeof e.target === "string"
				? e.target
				: "";
	if (!id || !from || !to) return null;
	const kind = typeof e.kind === "string" ? e.kind : DEFAULT_EDGE_KIND;
	const label = typeof e.label === "string" ? e.label : undefined;
	return { id, from, to, kind, label };
}

function coercePositions(
	raw: unknown,
): Record<string, { x: number; y: number }> | undefined {
	if (typeof raw !== "object" || raw === null) return undefined;
	const obj = raw as Record<string, unknown>;
	const result: Record<string, { x: number; y: number }> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value !== "object" || value === null) continue;
		const v = value as Record<string, unknown>;
		const x = typeof v.x === "number" ? v.x : Number(v.x);
		const y = typeof v.y === "number" ? v.y : Number(v.y);
		if (Number.isFinite(x) && Number.isFinite(y)) {
			result[key] = { x, y };
		}
	}
	return Object.keys(result).length > 0 ? result : undefined;
}

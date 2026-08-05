export type MosaicDirection = "vertical" | "horizontal";

export type MosaicNode =
	| { kind: "leaf"; tileId: string }
	| {
			kind: "split";
			direction: MosaicDirection;
			split: number;
			first: MosaicNode;
			second: MosaicNode;
		};

export const MIN_SIZE_PCT = 8;
export const MAX_SIZE_PCT = 92;

export function clampSplit(split: number): number {
	if (!Number.isFinite(split)) return 50;
	return Math.max(MIN_SIZE_PCT, Math.min(MAX_SIZE_PCT, Math.round(split * 100) / 100));
}

export function mosaicLeafIds(node: MosaicNode): string[] {
	return node.kind === "leaf"
		? [node.tileId]
		: [...mosaicLeafIds(node.first), ...mosaicLeafIds(node.second)];
}

export function sanitizeMosaicTree(
	value: unknown,
	allowed: ReadonlySet<string>,
): MosaicNode | null {
	if (!value || typeof value !== "object") return null;
	const candidate = value as Record<string, unknown>;
	if (candidate.kind === "leaf") {
		return typeof candidate.tileId === "string" && allowed.has(candidate.tileId)
			? { kind: "leaf", tileId: candidate.tileId }
			: null;
	}
	if (
		candidate.kind !== "split" ||
		(candidate.direction !== "vertical" && candidate.direction !== "horizontal")
	) {
		return null;
	}
	const first = sanitizeMosaicTree(candidate.first, allowed);
	const second = sanitizeMosaicTree(candidate.second, allowed);
	if (!first || !second || typeof candidate.split !== "number") return null;
	return {
		kind: "split",
		direction: candidate.direction,
		split: clampSplit(candidate.split),
		first,
		second,
	};
}

export function reconcileMosaicTree(
	value: unknown,
	visibleTiles: readonly string[],
): MosaicNode | null {
	const tree = sanitizeMosaicTree(value, new Set(visibleTiles));
	if (!tree) return null;
	const leaves = mosaicLeafIds(tree);
	const distinctLeaves = new Set(leaves);
	return leaves.length === visibleTiles.length &&
		distinctLeaves.size === leaves.length &&
		leaves.every((tileId) => visibleTiles.includes(tileId))
		? tree
		: null;
}

export function mosaicSplitAt(node: MosaicNode, path: readonly number[]): number {
	if (path.length === 0) return node.kind === "split" ? node.split : 50;
	if (node.kind === "leaf") return 50;
	const [branch, ...rest] = path;
	return mosaicSplitAt(branch === 0 ? node.first : node.second, rest);
}

export function updateMosaicSplit(
	node: MosaicNode,
	path: readonly number[],
	split: number,
): MosaicNode {
	if (path.length === 0) {
		return node.kind === "split" ? { ...node, split: clampSplit(split) } : node;
	}
	if (node.kind === "leaf") return node;
	const [branch, ...rest] = path;
	return branch === 0
		? { ...node, first: updateMosaicSplit(node.first, rest, split) }
		: { ...node, second: updateMosaicSplit(node.second, rest, split) };
}

import {
	clampSplit,
	type MosaicDirection,
	type MosaicNode,
} from "#/components/workspaceLayout";
import type { LearnExercise } from "#/data/learningCatalog";

interface TileConfig {
	id: string;
	label: string;
	defaultVisible: boolean;
	defaultSize: number;
}

const DEFAULT_TILES: TileConfig[] = [
	{ id: "editor", label: "Editor", defaultVisible: true, defaultSize: 44 },
	{ id: "terminal", label: "Terminal", defaultVisible: true, defaultSize: 28 },
	{ id: "content", label: "Lesson", defaultVisible: true, defaultSize: 28 },
	{ id: "hints", label: "Hints", defaultVisible: false, defaultSize: 20 },
	{ id: "questions", label: "Questions", defaultVisible: false, defaultSize: 20 },
	{ id: "fileExplorer", label: "Files", defaultVisible: false, defaultSize: 20 },
];

export const TILE_MAP = new Map<string, TileConfig>(
	DEFAULT_TILES.map((tile) => [tile.id, tile]),
);

type WeightedTile = {
	id: string;
	size: number;
};

function normalizeWeight(value: number): number {
	return Math.max(1, Number.isFinite(value) ? value : 1);
}

function buildTreeFromWeightedTiles(tiles: WeightedTile[], depth = 0): MosaicNode {
	if (tiles.length <= 1) {
		return { kind: "leaf", tileId: tiles[0]?.id ?? "editor" };
	}

	const total = tiles.reduce((sum, tile) => sum + normalizeWeight(tile.size), 0);
	const target = total / 2;
	let running = 0;
	let splitIndex = 1;

	for (let i = 0; i < tiles.length; i++) {
		running += normalizeWeight(tiles[i]!.size);
		if (running >= target) {
			splitIndex = i + 1;
			break;
		}
	}

	splitIndex = Math.max(1, Math.min(splitIndex, tiles.length - 1));
	const firstGroup = tiles.slice(0, splitIndex);
	const secondGroup = tiles.slice(splitIndex);
	const firstTotal = firstGroup.reduce(
		(sum, tile) => sum + normalizeWeight(tile.size),
		0,
	);
	const direction: MosaicDirection = depth % 2 === 0 ? "vertical" : "horizontal";

	return {
		kind: "split",
		direction,
		split: clampSplit((firstTotal / total) * 100),
		first: buildTreeFromWeightedTiles(firstGroup, depth + 1),
		second: buildTreeFromWeightedTiles(secondGroup, depth + 1),
	};
}

export function getTileConfigForExercise(exercise: LearnExercise): TileConfig[] {
	if (exercise.layout?.visibleTiles) {
		const visible = new Set<string>(exercise.layout.visibleTiles);
		return DEFAULT_TILES.map((tile) => ({ ...tile, defaultVisible: visible.has(tile.id) }));
	}
	if (exercise.tileLayout && exercise.tileLayout.length > 0) {
		const fromCatalog = exercise.tileLayout
			.map((entry) => {
				const known = TILE_MAP.get(entry.id);
				if (!known) return null;
				return {
					id: entry.id,
					label: known.label,
					defaultVisible: entry.defaultVisible,
					defaultSize: entry.defaultSize,
				};
			})
			.filter((entry): entry is TileConfig => entry !== null);

		if (fromCatalog.length > 0) {
			return fromCatalog;
		}
	}

	const shouldShowTerminal = ["parse", "tree", "run"].includes(exercise.command);
	const shouldShowFiles = exercise.difficulty === "intermediate";

	return DEFAULT_TILES.map((tile) => ({
		...tile,
		defaultVisible:
			tile.id === "editor" ||
			tile.id === "terminal" ||
			tile.id === "content" ||
			(tile.id === "fileExplorer" && shouldShowFiles) ||
			(tile.id === "hints" && shouldShowTerminal && exercise.hints.length > 0),
	}));
}

/** Returns the complete, non-user-mutable set of views declared for a lesson. */
export function getLessonTileIds(exercise: LearnExercise): string[] {
	const ids = getTileConfigForExercise(exercise)
		.filter((tile) => tile.defaultVisible)
		.map((tile) => tile.id);
	return ids.length > 0 ? ids : ["editor"];
}

/** Builds the deterministic split tree used by the fixed lesson workspace. */
export function buildLessonTileLayout(exercise: LearnExercise): MosaicNode {
	return buildTreeForVisible(getLessonTileIds(exercise), exercise);
}

function buildTreeForVisible(visible: string[], exercise: LearnExercise): MosaicNode {
	const config = getTileConfigForExercise(exercise);
	const allowed = new Set(config.map((tile) => tile.id));
	const deduped = [...new Set(visible)].filter((id) => allowed.has(id));
	const fallback = config
		.filter((tile) => tile.defaultVisible)
		.map((tile) => tile.id);
	const visibleTiles = deduped.length > 0 ? deduped : fallback;

	const weighted = visibleTiles
		.map((id) => {
			const tile = config.find((entry) => entry.id === id);
			return tile ? { id, size: tile.defaultSize } : null;
		})
		.filter((entry): entry is WeightedTile => entry !== null);

	const effective =
		weighted.length > 0
			? weighted
			: [{ id: "editor", size: 1 }, { id: "terminal", size: 1 }, { id: "content", size: 1 }];

	return buildTreeFromWeightedTiles(effective);
}

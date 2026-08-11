import {
	clampSplit,
	type MosaicDirection,
	type MosaicNode,
	reconcileMosaicTree,
} from "#/components/workspaceLayout";
import type { LearnExercise } from "#/data/learningCatalog";

export interface PersistedLayout {
	version: 2;
	visibleTiles: string[];
	tree: MosaicNode;
}

interface TileConfig {
	id: string;
	label: string;
	defaultVisible: boolean;
	defaultSize: number;
}

const LAYOUT_KEY = (exerciseId: string) => `exercise-${exerciseId}-layout`;
const LAYOUT_VERSION = 2;
export const HANDLE_SIZE_PX = 10;
export const KEYBOARD_SPLIT_STEP = 2;

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
			 (tile.id === "terminal" && shouldShowTerminal) ||
			 (tile.id === "fileExplorer" && shouldShowFiles),
	}));
}

export function buildPersistedFromVisible(visible: string[], exercise: LearnExercise): PersistedLayout {
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

	return {
		version: LAYOUT_VERSION,
		visibleTiles: effective.map((entry) => entry.id),
		tree: buildTreeFromWeightedTiles(effective),
	};
}

function sanitizeLayout(raw: unknown, exercise: LearnExercise): PersistedLayout {
	const fallback = buildPersistedFromVisible([], exercise);
	if (!raw || typeof raw !== "object") return fallback;

	const candidate = raw as {
		version?: unknown;
		visibleTiles?: unknown;
		tree?: unknown;
	};

	if (Array.isArray(candidate.visibleTiles) && candidate.visibleTiles.length > 0) {
		const allowed = new Set(getTileConfigForExercise(exercise).map((tile) => tile.id));
		const visible = candidate.visibleTiles.filter(
			(value): value is string => typeof value === "string" && allowed.has(value),
		);
		if (visible.length > 0) {
			const normalized = buildPersistedFromVisible(visible, exercise);
			const tree =
				candidate.version === LAYOUT_VERSION
					? reconcileMosaicTree(candidate.tree, normalized.visibleTiles)
					: null;
			if (tree) return { ...normalized, tree };
			return normalized;
		}
	}

	return fallback;
}

export function loadLayout(exercise: LearnExercise): PersistedLayout {
	try {
		const raw = localStorage.getItem(LAYOUT_KEY(exercise.id));
		if (!raw) return buildPersistedFromVisible([], exercise);

		const parsed = JSON.parse(raw) as unknown;
		return sanitizeLayout(parsed, exercise);
	} catch {
		return buildPersistedFromVisible([], exercise);
	}
}

export function persistLayout(exercise: LearnExercise, layout: PersistedLayout): void {
	try {
		localStorage.setItem(LAYOUT_KEY(exercise.id), JSON.stringify(layout));
	} catch {
		// ignore storage failures
	}
}

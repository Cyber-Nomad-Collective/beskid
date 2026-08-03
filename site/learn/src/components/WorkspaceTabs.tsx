import { clsx } from "clsx";
import { X } from "lucide-react";

export interface TileTab {
	id: string;
	label: string;
}

interface WorkspaceTabsProps {
	tiles: TileTab[];
	activeTile: string | null;
	onSelectTile: (id: string) => void;
	onCloseTile: (id: string) => void;
}

export function WorkspaceTabs({
	tiles,
	activeTile,
	onSelectTile,
	onCloseTile,
}: WorkspaceTabsProps) {
	if (tiles.length === 0) return null;

	const selectTile = (tile: TileTab) => {
		onSelectTile(tile.id);
		document.getElementById(`workspace-tab-${tile.id}`)?.focus();
	};

	const selectRelativeTile = (currentIndex: number, direction: number) => {
		const nextIndex = (currentIndex + direction + tiles.length) % tiles.length;
		const nextTile = tiles[nextIndex];
		if (!nextTile) return;
		selectTile(nextTile);
	};

	return (
		<div className="workspace-tab-bar" role="tablist">
			{tiles.map((tile, index) => (
				<div
					key={tile.id}
					className={clsx(
						"workspace-tab-group",
						activeTile === tile.id && "workspace-tab-group--active",
					)}
				>
					<button
						id={`workspace-tab-${tile.id}`}
						type="button"
						role="tab"
						aria-selected={activeTile === tile.id}
						aria-controls={`workspace-panel-${tile.id}`}
						tabIndex={activeTile === tile.id ? 0 : -1}
						className={clsx(
							"workspace-tab",
							activeTile === tile.id && "workspace-tab--active",
						)}
						onClick={() => onSelectTile(tile.id)}
						onKeyDown={(event) => {
							if (event.key === "ArrowRight") {
								event.preventDefault();
								selectRelativeTile(index, 1);
							}
							if (event.key === "ArrowLeft") {
								event.preventDefault();
								selectRelativeTile(index, -1);
							}
							if (event.key === "Home") {
								event.preventDefault();
								const firstTile = tiles[0];
								if (firstTile) selectTile(firstTile);
							}
							if (event.key === "End") {
								event.preventDefault();
								const lastTile = tiles[tiles.length - 1];
								if (lastTile) selectTile(lastTile);
							}
						}}
					>
						<span className="workspace-tab-label">{tile.label}</span>
					</button>
					<button
						type="button"
						className="workspace-tab-close"
						aria-label={`Close ${tile.label}`}
						onClick={() => onCloseTile(tile.id)}
					>
						<X className="w-3 h-3" />
					</button>
				</div>
			))}
		</div>
	);
}

import { X } from "lucide-react";
import { clsx } from "clsx";

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

	return (
		<div className="workspace-tab-bar" role="tablist">
			{tiles.map((tile) => (
				<button
					type="button"
					key={tile.id}
					role="tab"
					aria-selected={activeTile === tile.id}
					className={clsx(
						"workspace-tab",
						activeTile === tile.id && "workspace-tab--active",
					)}
					onClick={() => onSelectTile(tile.id)}
				>
					<span className="workspace-tab-label">{tile.label}</span>
					<span
						className="workspace-tab-close"
						role="button"
						aria-label={`Close ${tile.label}`}
						tabIndex={0}
						onClick={(e) => {
							e.stopPropagation();
							onCloseTile(tile.id);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								e.stopPropagation();
								onCloseTile(tile.id);
							}
						}}
					>
						<X className="w-3 h-3" />
					</span>
				</button>
			))}
		</div>
	);
}

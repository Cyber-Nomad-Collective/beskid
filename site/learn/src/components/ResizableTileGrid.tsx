import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef } from "react";

interface ResizableTileGridProps {
	children: React.ReactNode[];
	columnSizes: number[];
	onColumnSizesChange: (sizes: number[]) => void;
	minColumnWidth?: number;
}

const MIN_COLUMN_PX = 120;

export function ResizableTileGrid({
	children,
	columnSizes,
	onColumnSizesChange,
	minColumnWidth = MIN_COLUMN_PX,
}: ResizableTileGridProps) {
	const gridRef = useRef<HTMLDivElement>(null);
	const dragState = useRef<{
		index: number;
		startX: number;
		startSizes: number[];
	} | null>(null);

	const handleMouseDown = useCallback(
		(index: number) => (e: ReactMouseEvent) => {
			e.preventDefault();
			dragState.current = {
				index,
				startX: e.clientX,
				startSizes: [...columnSizes],
			};
		},
		[columnSizes],
	);

	const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
		const state = dragState.current;
		if (!state || !gridRef.current) return;

		const gridWidth = gridRef.current.getBoundingClientRect().width;
		if (gridWidth <= 0) return;

		const deltaPx = e.clientX - state.startX;
		const deltaPct = (deltaPx / gridWidth) * 100;

		const newSizes = [...state.startSizes];
		const leftIdx = state.index;
		const rightIdx = state.index + 1;

		// Clamp so neither column goes below minimum
		const minPct = (minColumnWidth / gridWidth) * 100;
		let clampedDelta = deltaPct;
		if (newSizes[leftIdx] + clampedDelta < minPct) {
			clampedDelta = minPct - newSizes[leftIdx];
		}
		if (newSizes[rightIdx] - clampedDelta < minPct) {
			clampedDelta = newSizes[rightIdx] - minPct;
		}

		newSizes[leftIdx] = Math.round((newSizes[leftIdx] + clampedDelta) * 100) / 100;
		newSizes[rightIdx] = Math.round((newSizes[rightIdx] - clampedDelta) * 100) / 100;

		onColumnSizesChange(newSizes);
	}, [minColumnWidth, onColumnSizesChange]);

	const handleMouseUp = useCallback(() => {
		dragState.current = null;
	}, []);

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	const gridTemplateColumns = columnSizes
		.map((s, i) => (i < columnSizes.length - 1 ? `${s}fr 4px` : `${s}fr`))
		.join(" ");

	const handles: React.ReactNode[] = [];
	for (let i = 0; i < children.length - 1; i++) {
		handles.push(
			<div
				key={`handle-${i}`}
				className="workspace-resize-handle"
				onMouseDown={handleMouseDown(i)}
			/>,
		);
	}

	// Interleave children and handles
	const items: React.ReactNode[] = [];
	for (let i = 0; i < children.length; i++) {
		items.push(
			<div key={`tile-${i}`} className="workspace-tile">
				{children[i]}
			</div>,
		);
		if (i < children.length - 1) {
			items.push(handles[i]);
		}
	}

	return (
		<div
			ref={gridRef}
			className="workspace-grid"
			style={{ gridTemplateColumns }}
		>
			{items}
		</div>
	);
}

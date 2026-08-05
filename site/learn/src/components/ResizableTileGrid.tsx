import {
	type MouseEvent as ReactMouseEvent,
	type TouchEvent as ReactTouchEvent,
	useCallback,
	useEffect,
	useRef,
} from "react";

interface ResizableTileGridProps {
	children: React.ReactNode[];
	tileIds: string[];
	activeTile: string | null;
	compact: boolean;
	columnSizes: number[];
	onColumnSizesChange: (sizes: number[]) => void;
	minColumnWidth?: number;
}

const MIN_COLUMN_PX = 120;
const HANDLE_GUTTER_PX = 10;

type PointerMoveEvent = MouseEvent | TouchEvent;

function getClientX(event: PointerMoveEvent): number | null {
	if ("touches" in event) {
		return event.touches[0]?.clientX ?? event.changedTouches[0]?.clientX ?? null;
	}
	return event.clientX;
}

export function ResizableTileGrid({
	children,
	tileIds,
	activeTile,
	compact,
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

	const clampAndApplyDelta = useCallback(
		(startSizes: number[], index: number, deltaPx: number, gridWidth: number): number[] => {
			const newSizes = [...startSizes];
			const leftIdx = index;
			const rightIdx = index + 1;
			const minPct = (minColumnWidth / gridWidth) * 100;
			const deltaPct = (deltaPx / gridWidth) * 100;

			let clampedDelta = deltaPct;
			if (newSizes[leftIdx] + clampedDelta < minPct) {
				clampedDelta = minPct - newSizes[leftIdx];
			}
			if (newSizes[rightIdx] - clampedDelta < minPct) {
				clampedDelta = newSizes[rightIdx] - minPct;
			}

			newSizes[leftIdx] = Math.round((newSizes[leftIdx] + clampedDelta) * 100) / 100;
			newSizes[rightIdx] = Math.round((newSizes[rightIdx] - clampedDelta) * 100) / 100;
			return newSizes;
		},
		[minColumnWidth],
	);

	const startDrag = useCallback(
		(index: number) => (e: ReactMouseEvent | ReactTouchEvent) => {
			e.preventDefault();
			const clientX = getClientX(e.nativeEvent);
			if (clientX === null) return;
			dragState.current = {
				index,
				startX: clientX,
				startSizes: [...columnSizes],
			};
		},
		[columnSizes],
	);

	const handlePointerMove = useCallback(
		(event: PointerMoveEvent) => {
			const state = dragState.current;
			if (!state || !gridRef.current) return;

			const gridWidth = gridRef.current.getBoundingClientRect().width;
			if (gridWidth <= 0) return;

			const clientX = getClientX(event);
			if (clientX === null) return;

			const deltaPx = clientX - state.startX;
			const newSizes = clampAndApplyDelta(state.startSizes, state.index, deltaPx, gridWidth);

			onColumnSizesChange(newSizes);
		},
		[clampAndApplyDelta, onColumnSizesChange],
	);

	const endDrag = useCallback(() => {
		dragState.current = null;
	}, []);

	useEffect(() => {
		document.addEventListener("mousemove", handlePointerMove);
		document.addEventListener("touchmove", handlePointerMove, { passive: false });
		document.addEventListener("mouseup", endDrag);
		document.addEventListener("touchend", endDrag);
		document.addEventListener("touchcancel", endDrag);
		return () => {
			document.removeEventListener("mousemove", handlePointerMove);
			document.removeEventListener("touchmove", handlePointerMove);
			document.removeEventListener("mouseup", endDrag);
			document.removeEventListener("touchend", endDrag);
			document.removeEventListener("touchcancel", endDrag);
		};
	}, [endDrag, handlePointerMove]);

	const gridTemplateColumns = columnSizes
		.map((s, i) => (i < columnSizes.length - 1 ? `${s}fr ${HANDLE_GUTTER_PX}px` : `${s}fr`))
		.join(" ");

	const handles: React.ReactNode[] = [];
	for (let i = 0; i < children.length - 1; i++) {
		handles.push(
			<div
				key={`handle-${i}`}
				className="workspace-resize-handle"
				onMouseDown={startDrag(i)}
				onTouchStart={startDrag(i)}
			/>,
		);
	}

	const items: React.ReactNode[] = [];
	for (let i = 0; i < children.length; i++) {
		const tileId = tileIds[i];
		const isActive = tileId === activeTile;
		const contentLabel = tileId ?? `tile-${i}`;
		items.push(
			<div
				key={`tile-${contentLabel}`}
				id={tileId ? `workspace-panel-${tileId}` : undefined}
				role="region"
				aria-labelledby={tileId ? `workspace-tab-${tileId}` : undefined}
				hidden={compact && !isActive}
				className={`workspace-tile ${
					isActive ? "workspace-tile--active" : "workspace-tile--inactive"
				}`}
			>
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

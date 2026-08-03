import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResizableTileGrid } from "./ResizableTileGrid";

describe("ResizableTileGrid", () => {
	it("marks only the selected tile as active for responsive layouts", () => {
		render(
			<ResizableTileGrid
				tileIds={["editor", "terminal"]}
				activeTile="terminal"
				columnSizes={[50, 50]}
				onColumnSizesChange={vi.fn()}
			>
				<div>Editor panel</div>
				<div>Terminal panel</div>
			</ResizableTileGrid>,
		);

		expect(
			screen.getByText("Editor panel").parentElement?.classList.contains(
				"workspace-tile--inactive",
			),
		).toBe(true);
		expect(
			screen.getByText("Terminal panel").parentElement?.classList.contains(
				"workspace-tile--active",
			),
		).toBe(true);
	});
});

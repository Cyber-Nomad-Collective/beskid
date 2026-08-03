import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResizableTileGrid } from "./ResizableTileGrid";

describe("ResizableTileGrid", () => {
	it("keeps desktop panels visible and hides inactive panels in compact mode", () => {
		const { rerender } = render(
			<ResizableTileGrid
				tileIds={["editor", "terminal"]}
				activeTile="terminal"
				compact={false}
				columnSizes={[50, 50]}
				onColumnSizesChange={vi.fn()}
			>
				<div>Editor panel</div>
				<div>Terminal panel</div>
			</ResizableTileGrid>,
		);

		const editor = screen.getByText("Editor panel").parentElement;
		const terminal = screen.getByText("Terminal panel").parentElement;
		expect(editor).toHaveAttribute("role", "region");
		expect(terminal).toHaveAttribute("role", "region");
		expect(editor).toHaveAttribute("aria-labelledby", "workspace-tab-editor");
		expect(terminal).toHaveAttribute("aria-labelledby", "workspace-tab-terminal");
		expect(editor).toBeVisible();

		rerender(
			<ResizableTileGrid
				tileIds={["editor", "terminal"]}
				activeTile="terminal"
				compact
				columnSizes={[50, 50]}
				onColumnSizesChange={vi.fn()}
			>
				<div>Editor panel</div>
				<div>Terminal panel</div>
			</ResizableTileGrid>,
		);

		expect(editor).not.toBeVisible();
		expect(terminal).toBeVisible();
	});
});

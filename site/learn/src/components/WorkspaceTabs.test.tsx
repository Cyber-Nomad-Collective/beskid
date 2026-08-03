import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceTabs } from "./WorkspaceTabs";

const tiles = [
	{ id: "editor", label: "Editor" },
	{ id: "terminal", label: "Terminal" },
	{ id: "content", label: "Lesson" },
];

describe("WorkspaceTabs", () => {
	it("links workspace navigation buttons to their panels", () => {
		const onSelectTile = vi.fn();
		render(
			<WorkspaceTabs
				tiles={tiles}
				activeTile="editor"
				onSelectTile={onSelectTile}
				onCloseTile={vi.fn()}
			/>,
		);

		expect(screen.getByRole("navigation", { name: "Workspace panels" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Editor" })).toHaveAttribute(
			"aria-controls",
			"workspace-panel-editor",
		);
		expect(screen.getByRole("button", { name: "Editor" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("supports ArrowLeft, ArrowRight, Home, End, and wraparound navigation", () => {
		const onSelectTile = vi.fn();
		render(
			<WorkspaceTabs
				tiles={tiles}
				activeTile="editor"
				onSelectTile={onSelectTile}
				onCloseTile={vi.fn()}
			/>,
		);

		const editor = screen.getByRole("button", { name: "Editor" });
		fireEvent.keyDown(editor, { key: "ArrowLeft" });
		fireEvent.keyDown(editor, { key: "ArrowRight" });
		fireEvent.keyDown(editor, { key: "Home" });
		fireEvent.keyDown(editor, { key: "End" });

		expect(onSelectTile).toHaveBeenNthCalledWith(1, "content");
		expect(onSelectTile).toHaveBeenNthCalledWith(2, "terminal");
		expect(onSelectTile).toHaveBeenNthCalledWith(3, "editor");
		expect(onSelectTile).toHaveBeenNthCalledWith(4, "content");
	});

	it("moves focus to the replacement after closing the active panel", async () => {
		function ControlledWorkspaceTabs() {
			const [openTiles, setOpenTiles] = useState(tiles);
			const [activeTile, setActiveTile] = useState<string | null>("editor");
			return (
				<WorkspaceTabs
					tiles={openTiles}
					activeTile={activeTile}
					onSelectTile={setActiveTile}
					onCloseTile={(id, replacementId) => {
						setOpenTiles((current) => current.filter((tile) => tile.id !== id));
						if (id === activeTile) setActiveTile(replacementId);
					}}
				/>
			);
		}

		render(<ControlledWorkspaceTabs />);
		fireEvent.click(screen.getByRole("button", { name: "Close Editor" }));

		expect(await screen.findByRole("button", { name: "Terminal" })).toHaveFocus();
	});

	it("exposes the close action as a separate button", () => {
		const onSelectTile = vi.fn();
		const onCloseTile = vi.fn();
		render(
			<WorkspaceTabs
				tiles={tiles}
				activeTile="editor"
				onSelectTile={onSelectTile}
				onCloseTile={onCloseTile}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Close Editor" }));

		expect(onCloseTile).toHaveBeenCalledWith("editor", "terminal");
		expect(onSelectTile).not.toHaveBeenCalled();
	});
});

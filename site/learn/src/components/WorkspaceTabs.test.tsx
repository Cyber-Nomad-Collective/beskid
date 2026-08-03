import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceTabs } from "./WorkspaceTabs";

const tiles = [
	{ id: "editor", label: "Editor" },
	{ id: "terminal", label: "Terminal" },
	{ id: "content", label: "Lesson" },
];

describe("WorkspaceTabs", () => {
	it("moves selection to the next tile with ArrowRight", () => {
		const onSelectTile = vi.fn();
		render(
			<WorkspaceTabs
				tiles={tiles}
				activeTile="editor"
				onSelectTile={onSelectTile}
				onCloseTile={vi.fn()}
			/>,
		);

		fireEvent.keyDown(screen.getByRole("tab", { name: "Editor" }), {
			key: "ArrowRight",
		});

		expect(onSelectTile).toHaveBeenCalledWith("terminal");
		expect(screen.getByRole("tab", { name: "Editor" }).getAttribute("aria-controls")).toBe(
			"workspace-panel-editor",
		);
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

		expect(onCloseTile).toHaveBeenCalledWith("editor");
		expect(onSelectTile).not.toHaveBeenCalled();
	});
});

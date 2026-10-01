import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PackageBrowseList } from "./package-browse-list";

const base = {
	kind: "documentation" as const,
	isPending: false,
	isError: false,
	entries: [] as { path: string; sizeBytes: number }[],
	onSelect: vi.fn(),
};

describe("PackageBrowseList", () => {
	it("distinguishes a failed request from an empty artifact", () => {
		render(<PackageBrowseList {...base} isError />);
		expect(screen.getByRole("alert")).toHaveTextContent(
			/could not load documentation/i,
		);
		expect(
			screen.queryByText(/no documentation files were published/i),
		).not.toBeInTheDocument();
	});

	it("shows loading before any empty-state claim", () => {
		render(<PackageBrowseList {...base} isPending />);
		expect(screen.getByText(/loading documentation files/i)).toBeInTheDocument();
		expect(
			screen.queryByText(/no documentation files were published/i),
		).not.toBeInTheDocument();
	});

	it("shows actual entries and invokes selection", () => {
		const onSelect = vi.fn();
		render(
			<PackageBrowseList
				{...base}
				entries={[{ path: "README.md", sizeBytes: 42 }]}
				onSelect={onSelect}
			/>,
		);
		screen.getByRole("button", { name: /README.md/ }).click();
		expect(onSelect).toHaveBeenCalledWith("README.md");
	});

	it("shows genuine empty source state", () => {
		render(<PackageBrowseList {...base} kind="source" />);
		expect(
			screen.getByText(/no source files were published/i),
		).toBeInTheDocument();
	});
});

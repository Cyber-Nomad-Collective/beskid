import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PackageFileBrowser } from "./package-file-browser";

const entries = [
	{ path: "README.md", sizeBytes: 20 },
	{ path: "src/main.bd", sizeBytes: 30 },
	{ path: "assets/logo.png", sizeBytes: 4096 },
];

function renderBrowser(
	props: Partial<Parameters<typeof PackageFileBrowser>[0]> = {},
) {
	const onSelect = vi.fn();
	render(
		<PackageFileBrowser
			packageName="acme.math"
			version="1.2.3"
			entries={entries}
			selectedPath="src/main.bd"
			onSelect={onSelect}
			file={{
				status: "ready",
				file: {
					path: "src/main.bd",
					sizeBytes: 30,
					encoding: "utf-8",
					limitBytes: null,
					content: "pub fn Main() {}\n",
				},
			}}
			downloadUrl="/download"
			{...props}
		/>,
	);
	return onSelect;
}

describe("PackageFileBrowser", () => {
	it("renders the tree, highlights the selected source and reports selections", async () => {
		const onSelect = renderBrowser();
		expect(screen.getByText("3 files · 4.0 KiB")).toBeInTheDocument();
		expect(
			screen.getByRole("tree", { name: "Files in acme.math 1.2.3" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "src/main.bd" }),
		).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByText("pub").getAttribute("style")).toContain(
				"--shiki-dark",
			),
		);

		fireEvent.click(screen.getByText("README.md"));
		expect(onSelect).toHaveBeenCalledWith("README.md");
	});

	it("renders Markdown files as rich text", () => {
		renderBrowser({
			selectedPath: "README.md",
			file: {
				status: "ready",
				file: {
					path: "README.md",
					sizeBytes: 20,
					encoding: "utf-8",
					limitBytes: null,
					content: "# Acme\n\nHello *world*.",
				},
			},
		});
		expect(
			screen.getByRole("heading", { level: 1, name: "Acme" }),
		).toBeInTheDocument();
		expect(screen.getByText("world")).toBeInTheDocument();
	});

	it("refuses to render binary and oversized files", () => {
		renderBrowser({
			selectedPath: "assets/logo.png",
			file: {
				status: "ready",
				file: {
					path: "assets/logo.png",
					sizeBytes: 4096,
					encoding: "binary",
					limitBytes: null,
					content: null,
				},
			},
		});
		expect(screen.getByText(/Binary file \(4\.0 KiB\)/)).toBeInTheDocument();
	});
});

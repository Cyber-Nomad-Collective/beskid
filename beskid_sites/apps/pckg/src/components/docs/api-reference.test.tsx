import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixture } from "#/lib/api-docs.fixture";
import { ApiReference } from "./api-reference";

function renderReference(selector = "") {
	const onSelect = vi.fn();
	render(
		<ApiReference
			api={fixture}
			packageName="corelib"
			version="0.4.0"
			selector={selector}
			onSelect={onSelect}
			sourceHref={(file) => `/files?path=${file}`}
		/>,
	);
	return onSelect;
}

describe("ApiReference", () => {
	it("opens on the first module with a namespace tree, member tables and an outline", () => {
		renderReference();
		const nav = screen.getByRole("navigation", {
			name: "API reference navigation",
		});
		expect(within(nav).getByText("Collections")).toBeInTheDocument();
		expect(within(nav).queryByText("__array_new")).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 1, name: "Collections" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Modules" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Enums" }),
		).toBeInTheDocument();
		const outline = screen.getByRole("navigation", { name: "In this article" });
		expect(within(outline).getByText("Modules")).toHaveAttribute(
			"href",
			"#modules",
		);
		expect(within(outline).getByText("Source")).toHaveAttribute(
			"href",
			"#source",
		);
	});

	it("renders a function page with definition, parameters, returns and examples", () => {
		const onSelect = renderReference("corelib::Collections::List::List");
		expect(
			screen.getByRole("heading", { level: 1, name: "List" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Definition" }),
		).toBeInTheDocument();
		expect(screen.getByText("type")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Fields" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Methods" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Remarks" }),
		).toBeInTheDocument();
		expect(screen.getByText("Indexed access is Tier 3.")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Count" }));
		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ id: 5, kind: "function" }),
		);
	});

	it("shows parameters and a cross-linked return type for a function", () => {
		const onSelect = renderReference("5");
		expect(
			screen.getByRole("heading", { level: 2, name: "Parameters" }),
		).toBeInTheDocument();
		expect(screen.getAllByText("list").length).toBeGreaterThan(0);
		expect(screen.getByText("List handle.")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Returns" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: "Examples" }),
		).toBeInTheDocument();
		expect(
			document.querySelector('#examples [data-line="1"]')?.textContent,
		).toContain("Count(list)");
		expect(screen.getByText("src/Collections/List.bd")).toHaveAttribute(
			"href",
			"/files?path=src/Collections/List.bd",
		);

		const parameters = document.querySelector("#parameters") as HTMLElement;
		fireEvent.click(within(parameters).getByRole("button", { name: "List" }));
		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ id: 3, kind: "type" }),
		);
	});

	it("filters the navigation tree", () => {
		renderReference();
		fireEvent.change(screen.getByRole("textbox", { name: "Filter API items" }), {
			target: { value: "shape" },
		});
		const nav = screen.getByRole("navigation", {
			name: "API reference navigation",
		});
		expect(within(nav).getByText("Shape")).toBeInTheDocument();
		expect(within(nav).queryByText("Count")).not.toBeInTheDocument();
	});
});

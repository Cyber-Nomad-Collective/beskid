import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchResult } from "../client/global-search";
import { GlobalSearch } from "../client/global-search";

const SAMPLE_RESULTS: SearchResult[] = [
	{
		id: "page-1",
		title: "Getting started",
		subtitle: "Book / intro",
		url: "/book/intro",
		category: "Book",
	},
	{
		id: "spec-1",
		title: "ABI",
		subtitle: "Beskid standard",
		url: "/docs/standard/",
		category: "Spec",
	},
];

function makeSearchFn(
	results: SearchResult[] = SAMPLE_RESULTS,
	delay = 0,
): (q: string) => Promise<SearchResult[]> {
	return vi.fn(async (query: string) => {
		if (delay) await new Promise((r) => setTimeout(r, delay));
		return results.filter((r) =>
			r.title.toLowerCase().includes(query.toLowerCase()),
		);
	});
}

describe("GlobalSearch", () => {
	afterEach(() => {
		cleanup();
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it("renders the trigger button with the keyboard hint", () => {
		render(<GlobalSearch searchFn={makeSearchFn()} />);
		expect(screen.getByRole("button", { name: "Open search" })).not.toBeNull();
	});

	it("opens the palette on trigger click and shows the input", async () => {
		render(<GlobalSearch searchFn={makeSearchFn()} placeholder="Find…" />);
		fireEvent.click(screen.getByRole("button", { name: "Open search" }));
		await waitFor(() => {
			expect(screen.getByPlaceholderText("Find…")).not.toBeNull();
		});
	});

	it("calls searchFn and renders grouped results", async () => {
		const searchFn = makeSearchFn();
		render(<GlobalSearch searchFn={searchFn} debounceMs={0} />);
		fireEvent.click(screen.getByRole("button", { name: "Open search" }));
		const input = await screen.findByPlaceholderText("Search…");
		fireEvent.change(input, { target: { value: "abi" } });

		await waitFor(() => {
			expect(searchFn).toHaveBeenCalledWith("abi");
			expect(screen.getByText("ABI")).not.toBeNull();
		});
		// Category heading renders.
		expect(screen.getByText("Spec")).not.toBeNull();
	});

	it("persists and shows recent searches on reopen", async () => {
		const navigate = vi.fn();
		render(
			<GlobalSearch
				searchFn={makeSearchFn()}
				debounceMs={0}
				navigate={navigate}
				storageKey="test:recent"
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Open search" }));
		const input = await screen.findByPlaceholderText("Search…");
		fireEvent.change(input, { target: { value: "getting" } });

		const item = await screen.findByText("Getting started");
		fireEvent.click(item);

		await waitFor(() => {
			expect(navigate).toHaveBeenCalledWith("/book/intro");
		});

		// Reopen — recent section should list the picked result.
		fireEvent.click(screen.getByRole("button", { name: "Open search" }));
		await waitFor(() => {
			expect(screen.getByText("Recent")).not.toBeNull();
			expect(screen.getAllByText("Getting started").length).toBeGreaterThan(0);
		});
	});

	it("shows an empty state when the query has no matches", async () => {
		render(<GlobalSearch searchFn={makeSearchFn()} debounceMs={0} />);
		fireEvent.click(screen.getByRole("button", { name: "Open search" }));
		const input = await screen.findByPlaceholderText("Search…");
		fireEvent.change(input, { target: { value: "zzzznope" } });
		await waitFor(() => {
			expect(screen.getByText("No results found.")).not.toBeNull();
		});
	});
});

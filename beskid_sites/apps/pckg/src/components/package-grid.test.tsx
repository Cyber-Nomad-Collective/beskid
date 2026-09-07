import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PackageSummary } from "#/lib/pckg-api";
import { PackageGrid } from "./package-grid";

function makePackage(over: Partial<PackageSummary> = {}): PackageSummary {
	return {
		id: "1",
		name: "beskid.http",
		description: "HTTP client",
		category: "network",
		repositoryUrl: null,
		websiteUrl: null,
		tags: ["http", "client", "async"],
		totalDownloads: 1234,
		updatedAtUtc: "2026-01-01T00:00:00Z",
		ownerDisplayName: "octocat",
		...over,
	};
}

describe("PackageGrid", () => {
	it("renders a card per package", () => {
		render(
			<PackageGrid
				items={[makePackage(), makePackage({ id: "2", name: "beskid.json" })]}
			/>,
		);
		expect(screen.getByText("beskid.http")).toBeInTheDocument();
		expect(screen.getByText("beskid.json")).toBeInTheDocument();
		expect(screen.getAllByText(/downloads/).length).toBeGreaterThan(0);
		expect(screen.getAllByText("network").length).toBe(2);
	});

	it("renders the empty-state card when there are no packages", () => {
		render(<PackageGrid items={[]} />);
		expect(
			screen.getByText("No packages match this search."),
		).toBeInTheDocument();
	});

	it("renders a custom empty message", () => {
		render(<PackageGrid items={[]} emptyMessage="Nothing here." />);
		expect(screen.getByText("Nothing here.")).toBeInTheDocument();
	});
});

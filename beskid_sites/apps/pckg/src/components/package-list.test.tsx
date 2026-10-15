import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PackageSummary } from "#/lib/pckg-api";
import { PackageList } from "./package-list";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => (
		<a href="#test" className={className}>
			{children}
		</a>
	),
}));

function makePackage(over: Partial<PackageSummary> = {}): PackageSummary {
	return {
		id: "1",
		name: "corelib_http",
		packageKind: "library",
		template: null,
		description: "HTTP framing",
		category: "Library",
		repositoryUrl: null,
		websiteUrl: null,
		tags: ["corelib", "http", "beskid"],
		totalDownloads: 1234,
		updatedAtUtc: "2026-10-01T12:00:00Z",
		ownerDisplayName: "octocat",
		community: null,
		...over,
	};
}

describe("PackageList", () => {
	it("renders a row per package with deterministic counts and dates", () => {
		render(
			<PackageList
				items={[
					makePackage(),
					makePackage({
						id: "2",
						name: "beskid.templates.console",
						packageKind: "template",
					}),
				]}
			/>,
		);
		expect(screen.getByText("corelib_http")).toBeInTheDocument();
		expect(screen.getByText("Template")).toBeInTheDocument();
		expect(screen.getAllByText("1,234 downloads")).toHaveLength(2);
		expect(screen.getAllByText("Updated 1 Oct 2026")).toHaveLength(2);
		// Only libraries carry API docs; every package has a file browser.
		expect(screen.getAllByText("Docs")).toHaveLength(1);
		expect(screen.getAllByText("Files")).toHaveLength(2);
		expect(screen.queryByText("beskid")).not.toBeInTheDocument();
	});

	it("turns tags into filters when a handler is given", () => {
		const onTagSelect = vi.fn();
		render(<PackageList items={[makePackage()]} onTagSelect={onTagSelect} />);
		fireEvent.click(screen.getByRole("button", { name: "http" }));
		expect(onTagSelect).toHaveBeenCalledWith("http");
	});

	it("shows the empty message", () => {
		render(<PackageList items={[]} emptyMessage="Nothing here." />);
		expect(screen.getByText("Nothing here.")).toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StandardLinks } from "../../src/components/standard-links";

describe("StandardLinks", () => {
	it("renders typed stable standard metadata with an accessible canonical link", () => {
		render(
			<StandardLinks
				links={[
					{
						type: "spec",
						stableId: "standard.tooling.nexus.mcp",
						title: "MCP transport",
						href: "/standard/tooling--nexus#mcp-transport",
						revision: "revision-2",
					},
				]}
			/>,
		);

		const link = screen.getByRole("link", { name: /MCP transport/i });
		expect(link).toHaveAttribute(
			"href",
			"/standard/tooling--nexus#mcp-transport",
		);
		expect(link).toHaveAttribute("data-standard-link", "spec");
		expect(link).toHaveAttribute(
			"data-standard-id",
			"standard.tooling.nexus.mcp",
		);
		expect(link).toHaveAttribute("data-standard-revision", "revision-2");
	});

	it("renders persisted version-1 links as spec links", () => {
		render(
			<StandardLinks
				links={[{ title: "Legacy standard link", href: "/platform-spec/a" }]}
			/>,
		);
		expect(
			screen.getByRole("link", { name: /Legacy standard link/i }),
		).toHaveAttribute("data-standard-link", "spec");
	});
});

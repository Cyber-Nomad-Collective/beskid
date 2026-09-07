import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	parseTypedDocLink,
	TypedDocLinkCard,
} from "../../src/components/typed-doc-link";

describe("typed documentation links", () => {
	it("parses and renders a stable OpenSpec reference", () => {
		const link = parseTypedDocLink(
			"spec",
			"ref: tooling--nexus--design-model#BSP-REQ-123\ntitle: Nexus design",
		);
		expect(link).not.toBeNull();
		render(<TypedDocLinkCard link={link!} />);
		const anchor = screen.getByRole("link", { name: /Nexus design/i });
		expect(anchor).toHaveAttribute("data-doc-link", "spec");
		expect(anchor).toHaveAttribute(
			"href",
			expect.stringContaining("tooling--nexus--design-model"),
		);
	});

	it("keeps Book, Nexus, and bug targets typed", () => {
		for (const kind of ["book", "nexus", "bug"] as const) {
			expect(parseTypedDocLink(kind, "ref: target")?.kind).toBe(kind);
		}
	});
});

import { describe, expect, it } from "vitest";

import {
	parseBeskidDirective,
	transformBeskidDirectives,
} from "./markdown-directives";

describe("Beskid Markdown directives", () => {
	it("parses typed directive fields", () => {
		expect(
			parseBeskidDirective(
				"spec",
				"ref: compiler--pipeline--aot#artifact\ntitle: AOT artifact",
			),
		).toEqual({
			kind: "spec",
			ref: "compiler--pipeline--aot#artifact",
			title: "AOT artifact",
		});
	});

	it("keeps readable fallback content in a custom element", () => {
		const html = transformBeskidDirectives(
			"```book\nref: 14-from-source-to-runs\ntitle: Build chapter\n```",
		);
		expect(html).toContain('<beskid-doc-embed kind="book"');
		expect(html).toContain(">Build chapter</a>");
	});
});

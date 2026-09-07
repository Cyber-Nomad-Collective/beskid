import { describe, expect, it } from "vitest";

import { parseSpecLinks } from "#/lib/platform-spec/parse";

describe("parseSpecLinks", () => {
	it("parses legacy Spec markers and markdown links without throwing", () => {
		const body = [
			"Spec: /platform-spec/compiler/foo",
			"[Compiler](/platform-spec/compiler/bar)",
			"See /platform-spec/site/docs",
		].join("\n");

		expect(() => parseSpecLinks(body)).not.toThrow();
		const links = parseSpecLinks(body);
		expect(links.map((l) => l.path)).toEqual(
			expect.arrayContaining([
				"/platform-spec/compiler/foo",
				"/platform-spec/compiler/bar",
				"/platform-spec/site/docs",
			]),
		);
	});

	it("returns empty array for empty body", () => {
		expect(parseSpecLinks("")).toEqual([]);
	});
});

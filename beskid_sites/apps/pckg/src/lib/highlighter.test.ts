import { describe, expect, it } from "vitest";
import { highlightLines } from "./highlighter";

describe("highlightLines", () => {
	it("colors Beskid source with the canonical trudoc grammar", async () => {
		const lines = await highlightLines(
			'pub fn Count() -> i64 { return "x" } // tail',
			"beskid",
		);
		const [line] = lines ?? [];
		expect(line.map((token) => token.content).join("")).toBe(
			'pub fn Count() -> i64 { return "x" } // tail',
		);
		const colors = new Set(line.map((token) => token.htmlStyle?.color));
		expect(colors.size).toBeGreaterThan(2);
		expect(line.every((token) => token.htmlStyle?.["--shiki-dark"])).toBe(true);
	});

	it("highlights BSOL manifests and leaves plain text alone", async () => {
		const bsol = await highlightLines('corelib {\n  name = "corelib"\n}', "bsol");
		expect(bsol).toHaveLength(3);
		expect(await highlightLines("Apache-2.0", "text")).toBeUndefined();
	});
});

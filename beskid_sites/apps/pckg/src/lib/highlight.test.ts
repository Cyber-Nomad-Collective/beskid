import { describe, expect, it } from "vitest";
import { languageForPath, tokenize } from "./highlight";

describe("languageForPath", () => {
	it("maps artifact file extensions to viewer languages", () => {
		expect(languageForPath("src/Main.bd")).toBe("beskid");
		expect(languageForPath("acme_math.bproj")).toBe("bsol");
		expect(languageForPath("package.json")).toBe("json");
		expect(languageForPath("README.md")).toBe("markdown");
		expect(languageForPath("LICENSE")).toBe("text");
	});
});

describe("tokenize", () => {
	it("classifies Beskid keywords, types, strings, attributes and comments", () => {
		const [line] = tokenize(
			'pub fn Count(list: List<T>) -> i64 { return "x" } // tail',
			"beskid",
		);
		const kinds = Object.fromEntries(
			line.map((token) => [token.text, token.kind]),
		);
		expect(kinds.pub).toBe("keyword");
		expect(kinds.fn).toBe("keyword");
		expect(kinds.Count).toBe("type");
		expect(kinds.List).toBe("type");
		expect(
			line.some((token) => token.kind === "plain" && token.text.includes("i64")),
		).toBe(true);
		expect(kinds['"x"']).toBe("string");
		expect(kinds["// tail"]).toBe("comment");
		const [attribute] = tokenize("@tier(supported)", "beskid");
		expect(attribute[0]).toEqual({ kind: "attribute", text: "@tier" });
	});

	it("carries block comments across lines and never leaks them", () => {
		const lines = tokenize("let a = 1 /* open\nstill */ let b = 2", "beskid");
		expect(lines[0].at(-1)).toEqual({ kind: "comment", text: "/* open" });
		expect(lines[1][0]).toEqual({ kind: "comment", text: "still */" });
		expect(lines[1].find((token) => token.text === "let")?.kind).toBe("keyword");
	});

	it("marks JSON keys as properties and literals as keywords", () => {
		const [line] = tokenize('{"schemaVersion": 4, "ok": true}', "json");
		expect(line.find((token) => token.text === '"schemaVersion"')?.kind).toBe(
			"property",
		);
		expect(line.find((token) => token.text === "4")?.kind).toBe("number");
		expect(line.find((token) => token.text === "true")?.kind).toBe("keyword");
		expect(line.find((token) => token.text === '"ok"')?.kind).toBe("property");
	});

	it("keeps plain text untouched", () => {
		expect(tokenize("Apache-2.0\n", "text")).toEqual([
			[{ kind: "plain", text: "Apache-2.0" }],
			[],
		]);
	});
});

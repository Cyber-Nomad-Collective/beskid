import { describe, expect, it } from "vitest";
import { languageForPath } from "./languages";

describe("languageForPath", () => {
	it("maps artifact file extensions to viewer languages", () => {
		expect(languageForPath("src/Main.bd")).toBe("beskid");
		expect(languageForPath("acme_math.bproj")).toBe("bsol");
		expect(languageForPath("package.json")).toBe("json");
		expect(languageForPath("README.md")).toBe("markdown");
		expect(languageForPath("LICENSE")).toBe("text");
	});
});

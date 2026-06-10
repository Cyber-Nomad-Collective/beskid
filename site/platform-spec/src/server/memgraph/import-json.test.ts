import { describe, expect, it } from "vitest";
import { pathClassFromRel, parentSlugFromPath } from "@cyber-nomad-collective/spec-core";

describe("import-json helpers", () => {
	it("derives parent slug for domain nodes", () => {
		const pathClass = pathClassFromRel("compiler/index");
		expect(pathClass).toBe("domain");
		expect(parentSlugFromPath("platform-spec/compiler", pathClass)).toBe(
			"platform-spec",
		);
	});
});

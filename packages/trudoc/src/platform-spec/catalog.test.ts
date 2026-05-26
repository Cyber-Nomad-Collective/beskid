import { describe, expect, it } from "vitest";

import {
	catalogDocContentPath,
	decodeCatalogDocSlug,
	encodeCatalogDocSlug,
	parentSlugForCatalog,
} from "./catalog";

describe("platform-spec catalog helpers", () => {
	it("round-trips slug encoding", () => {
		const slug = "platform-spec/compiler/mods/adr/foo";
		const encoded = encodeCatalogDocSlug(slug);
		expect(encoded).not.toContain("/");
		expect(decodeCatalogDocSlug(encoded)).toBe(slug);
	});

	it("builds content paths", () => {
		expect(catalogDocContentPath("platform-spec/a/b")).toContain(
			"platform-spec--a--b.json",
		);
	});

	it("derives parent slug for adr", () => {
		expect(
			parentSlugForCatalog("platform-spec/compiler/mods/adr/foo", "adr"),
		).toBe("platform-spec/compiler/mods");
	});
});

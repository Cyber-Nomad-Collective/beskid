import { describe, expect, it } from "vitest";
import { searchString } from "./search-params";

describe("searchString", () => {
	it("keeps strings, stringifies router-parsed numbers and drops anything else", () => {
		expect(searchString("Collections::List")).toBe("Collections::List");
		expect(searchString(53)).toBe("53");
		expect(searchString(undefined)).toBe("");
		expect(searchString({ nested: true })).toBe("");
	});
});

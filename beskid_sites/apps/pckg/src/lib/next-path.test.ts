import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
	it("keeps same-origin paths with their query", () => {
		expect(safeNextPath("/dashboard/release")).toBe("/dashboard/release");
		expect(safeNextPath("/docs/corelib_http?tab=api")).toBe(
			"/docs/corelib_http?tab=api",
		);
	});

	it("falls back to the dashboard for anything that could leave the site", () => {
		for (const next of [
			null,
			"",
			"dashboard",
			"//evil.example",
			"https://evil.example",
			"/\\evil.example",
		]) {
			expect(safeNextPath(next)).toBe("/dashboard");
		}
	});
});

import { describe, expect, it } from "vitest";

import { isStaticAssetRequest } from "./server-routing";

describe("isStaticAssetRequest", () => {
	it("keeps extensionless client routes eligible for the SPA fallback", () => {
		expect(isStaticAssetRequest("/learn")).toBe(false);
		expect(isStaticAssetRequest("/lesson/01_hello_beskid")).toBe(false);
	});

	it("keeps missing built assets out of the SPA fallback", () => {
		expect(isStaticAssetRequest("/assets/missing.js")).toBe(true);
		expect(isStaticAssetRequest("/favicon.ico")).toBe(true);
	});
});

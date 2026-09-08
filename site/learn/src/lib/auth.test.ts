import { describe, expect, it } from "vitest";

import { authHubLoginUrl, authHubProfileUrl } from "./auth";

describe("Auth hub links", () => {
	it("starts sign-in through the protected learn origin", () => {
		expect(authHubLoginUrl()).toBe("https://learn.beskid-lang.org/");
	});

	it("uses Authentik's user interface for profile settings", () => {
		expect(authHubProfileUrl()).toBe("https://auth.beskid-lang.org/if/user/");
	});
});

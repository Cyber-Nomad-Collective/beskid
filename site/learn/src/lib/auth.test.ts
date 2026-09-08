import { describe, expect, it } from "vitest";

import { authentikLoginUrl, authentikProfileUrl } from "./auth";

describe("Authentik links", () => {
	it("starts sign-in at Learn's Authentik outpost", () => {
		expect(authentikLoginUrl()).toBe("https://learn.beskid-lang.org/outpost.goauthentik.io/start?rd=https%3A%2F%2Flearn.beskid-lang.org%2F");
	});

	it("uses Authentik's user interface for profile settings", () => {
		expect(authentikProfileUrl()).toBe("https://auth.beskid-lang.org/if/user/");
	});
});

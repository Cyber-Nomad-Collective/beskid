import { describe, expect, it, vi } from "vitest";

vi.mock("#/env.server", () => ({
	env: { NODE_ENV: "production" },
}));

import {
	clearOAuthStateCookieHeader,
	readOAuthStateCookie,
} from "#/server/oauth-cookies";

describe("OAuth state cookie", () => {
	it("uses the same secure cookie policy when clearing state", () => {
		expect(clearOAuthStateCookieHeader()).toContain("Secure");
	});

	it("treats malformed cookie encoding as missing state", () => {
		const request = new Request("https://auth.example.test/callback", {
			headers: { Cookie: "beskid_auth_oauth_state=%E0%A4%A" },
		});

		expect(readOAuthStateCookie(request)).toBeNull();
	});
});

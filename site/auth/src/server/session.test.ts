import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

const sessionSecret = "a-session-secret-that-is-at-least-32-characters";

vi.mock("#/env.server", () => ({
	env: {
		NODE_ENV: "production",
		SESSION_SECRET: "a-session-secret-that-is-at-least-32-characters",
	},
}));

vi.mock("#/server/repositories/user-sessions", () => ({
	getGithubTokenForSession: vi.fn(),
	getUserSession: vi.fn(() => ({
		id: "session-1",
		login: "octocat",
		avatar_url: "",
		name: null,
	})),
}));

import {
	clearSessionCookieHeader,
	getSessionFromRequest,
} from "#/server/session";

describe("hub browser session", () => {
	it("rejects a session signed with a different JWT algorithm", async () => {
		const token = await new SignJWT({ sid: "session-1" })
			.setProtectedHeader({ alg: "HS512" })
			.setExpirationTime("1h")
			.sign(new TextEncoder().encode(sessionSecret));
		const request = new Request("https://auth.example.test/profile", {
			headers: { Cookie: `beskid_auth_session=${token}` },
		});

		expect(await getSessionFromRequest(request)).toBeNull();
	});

	it("uses the same secure cookie policy when clearing a session", () => {
		expect(clearSessionCookieHeader()).toContain("Secure");
	});
});

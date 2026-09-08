import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getServiceTokenForApp, getGithubTokenForSession } = vi.hoisted(() => ({
	getServiceTokenForApp: vi.fn(),
	getGithubTokenForSession: vi.fn(),
}));

vi.mock("#/server/repositories/paired-apps", () => ({
	getServiceTokenForApp,
}));

vi.mock("#/server/repositories/user-sessions", () => ({
	getGithubTokenForSession,
}));

import { proxyGitHubApi } from "#/server/github-proxy";

const serviceToken = "a-32-character-service-token-secret";

describe("proxyGitHubApi", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		getServiceTokenForApp.mockReset();
		getGithubTokenForSession.mockReset();
	});

	it("rejects a signed token for a retired service id", async () => {
		getServiceTokenForApp.mockReturnValue(serviceToken);
		getGithubTokenForSession.mockReturnValue("github-token");
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response("{}"));
		const hubUserToken = await new SignJWT({
			app: "platform-spec",
			sid: "session-1",
		})
			.setProtectedHeader({ alg: "HS256" })
			.setIssuer("beskid-auth-hub")
			.setExpirationTime("1h")
			.sign(new TextEncoder().encode(serviceToken));

		const response = await proxyGitHubApi(
			new Request("https://auth.beskid-lang.org:8090/api/v1/github/user", {
				headers: { Authorization: `Bearer ${hubUserToken}` },
			}),
			"user",
		);

		expect(response.status).toBe(401);
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});

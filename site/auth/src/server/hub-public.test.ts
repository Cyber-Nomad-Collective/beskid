import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/env.server", () => ({
	env: {
		AUTH_HUB_PUBLIC_URL: "https://auth.example.com/",
	},
}));

describe("hub-public", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("hubPublicBase strips trailing slash", async () => {
		const { hubPublicBase } = await import("#/server/hub-public.server");
		expect(hubPublicBase()).toBe("https://auth.example.com");
	});

	it("hubOAuthCallbackUrl appends /callback", async () => {
		const { hubOAuthCallbackUrl } = await import("#/server/hub-public.server");
		expect(hubOAuthCallbackUrl()).toBe("https://auth.example.com/callback");
	});
});

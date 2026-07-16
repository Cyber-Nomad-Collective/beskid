import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import {
	issueHandoffToken,
	verifyHandoffToken,
} from "../../../../beskid_web_common/packages/beskid-auth-client/src/handoff.ts";

const serviceToken = "a-32-character-service-token-secret";

describe("Auth Hub paired handoff", () => {
	it("returns the stable GitHub subject without exposing credentials", async () => {
		const token = await issueHandoffToken(serviceToken, {
			app: "pckg",
			sessionId: "session-1",
			login: "octocat",
			avatarUrl: "https://avatars.example.test/octocat",
			name: "The Octocat",
			subject: "github:583231",
		});

		const payload = await verifyHandoffToken(serviceToken, token, "pckg");

		expect(payload).toMatchObject({
			app: "pckg",
			sessionId: "session-1",
			login: "octocat",
			subject: "github:583231",
		});
		expect(JSON.stringify(payload)).not.toContain("password");
	});

	it("rejects a pckg handoff without a canonical GitHub subject", async () => {
		await expect(
			issueHandoffToken(serviceToken, {
				app: "pckg",
				sessionId: "session-1",
				login: "octocat",
				avatarUrl: "https://avatars.example.test/octocat",
				name: "The Octocat",
				subject: "oidc:octocat",
			}),
		).rejects.toThrow("canonical GitHub subject");
	});

	it("rejects a legacy pckg token that has no GitHub subject", async () => {
		const token = await new SignJWT({
			app: "pckg",
			sid: "session-1",
			login: "octocat",
			avatar_url: "https://avatars.example.test/octocat",
		})
			.setProtectedHeader({ alg: "HS256" })
			.setIssuer("beskid-auth-hub")
			.setExpirationTime("1h")
			.sign(new TextEncoder().encode(serviceToken));

		expect(await verifyHandoffToken(serviceToken, token, "pckg")).toBeNull();
	});
});

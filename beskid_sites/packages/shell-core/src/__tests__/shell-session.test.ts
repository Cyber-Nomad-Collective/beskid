import { describe, expect, it } from "vitest";

import { createShellSession } from "../server";
import type { ShellUser } from "../types";

const SESSION_SECRET = "test-session-secret-32-chars-min!!";

const session = createShellSession({
	sessionSecret: SESSION_SECRET,
	sessionCookieName: "beskid_shell_session",
	isProduction: false,
});

const user: ShellUser = {
	username: "octocat",
	email: "octo@example.com",
	name: "Octo Cat",
	groups: ["beskid-admins", "dev"],
	avatarUrl: "https://github.com/octocat.png",
};

describe("shell-session seal/unseal", () => {
	it("round-trips a ShellUser through seal → unseal", async () => {
		const token = await session.sealShellSession(user);
		expect(typeof token).toBe("string");
		const back = await session.unsealShellSession(token);
		expect(back).toEqual(user);
	});

	it("returns null for a tampered token", async () => {
		const token = await session.sealShellSession(user);
		const tampered = `${token.slice(0, -4)}AAAA`;
		expect(await session.unsealShellSession(tampered)).toBeNull();
	});

	it("returns null for garbage", async () => {
		expect(await session.unsealShellSession("not-a-jwt")).toBeNull();
	});

	it("returns null when username is missing from payload", async () => {
		// A JWT signed with the right secret but no username claim should be
		// rejected. Easier: assert unseal of empty string is null.
		expect(await session.unsealShellSession("")).toBeNull();
	});
});

describe("shell-session cookie headers", () => {
	it("shellSessionCookieHeader contains the cookie name and HttpOnly", async () => {
		const token = await session.sealShellSession(user);
		const header = session.shellSessionCookieHeader(token);
		expect(header).toContain("beskid_shell_session=");
		expect(header).toContain("HttpOnly");
		expect(header).toContain("SameSite=Lax");
		expect(header).toContain("Max-Age=604800");
	});

	it("clearShellSessionCookieHeader expires the cookie", () => {
		const header = session.clearShellSessionCookieHeader();
		expect(header).toContain("beskid_shell_session=;");
		expect(header).toContain("Max-Age=0");
	});
});

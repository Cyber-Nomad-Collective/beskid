import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createShellAuth } from "../server";
import type { ShellUser } from "../types";

const SESSION_SECRET = "test-session-secret-32-chars-min!!";

const auth = createShellAuth({
	issuer: "http://localhost:9091",
	clientId: "test-client-id",
	clientSecret: "test-client-secret",
	sessionSecret: SESSION_SECRET,
	sessionCookieName: "beskid_shell_session",
	isProduction: false,
});

const fakeUser: ShellUser = {
	username: "octocat",
	email: "octo@example.com",
	name: "Octo Cat",
	groups: ["beskid-admins", "dev"],
	avatarUrl: "https://github.com/octocat.png",
};

describe("resolveShellUser (mock mode)", () => {
	// The default SHELL_AUTH_MODE is mock; these tests run without env set.
	it("returns a fake user in mock mode regardless of session cookie", async () => {
		const user = await auth.resolveShellUser(null);
		expect(user).not.toBeNull();
		expect(user?.username).toBe("beskid-dev");
		expect(user?.groups).toContain("beskid-admins");
	});

	it("ignores a session token in mock mode", async () => {
		const user = await auth.resolveShellUser("anything");
		expect(user?.username).toBe("beskid-dev");
	});
});

describe("resolveShellUser (authelia mode)", () => {
	beforeEach(() => {
		process.env.SHELL_AUTH_MODE = "authelia";
	});
	afterEach(() => {
		delete process.env.SHELL_AUTH_MODE;
	});

	it("returns null when there is no session cookie", async () => {
		expect(await auth.resolveShellUser(null)).toBeNull();
	});

	it("returns the sealed user when the session cookie is valid", async () => {
		const token = await auth.session.sealShellSession(fakeUser);
		const user = await auth.resolveShellUser(token);
		expect(user).toEqual(fakeUser);
	});

	it("returns null when the session cookie is tampered", async () => {
		expect(await auth.resolveShellUser("not-a-valid-jwt")).toBeNull();
	});
});

describe("guards", () => {
	it("requireShellUser throws when unauthenticated", () => {
		expect(() => auth.requireShellUser(null)).toThrow();
	});

	it("requireShellUser returns the user when authenticated", () => {
		expect(auth.requireShellUser(fakeUser)).toBe(fakeUser);
	});

	it("requireShellGroup throws when the group is missing", () => {
		expect(() => auth.requireShellGroup(fakeUser, "nope")).toThrow();
	});

	it("requireShellGroup returns the user when the group is present", () => {
		expect(auth.requireShellGroup(fakeUser, "beskid-admins")).toBe(fakeUser);
	});

	it("requireShellGroup throws when unauthenticated", () => {
		expect(() => auth.requireShellGroup(null, "beskid-admins")).toThrow();
	});
});

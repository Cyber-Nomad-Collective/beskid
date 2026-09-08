import { describe, expect, it } from "vitest";

import { claimsToShellUser } from "../server";

describe("claimsToShellUser", () => {
	it("maps preferred_username, email, name, groups", () => {
		const user = claimsToShellUser({
			preferred_username: "octocat",
			email: "octo@example.com",
			name: "Octo Cat",
			groups: ["beskid-admins", "dev"],
			sub: "12345",
		});
		expect(user).toEqual({
			username: "octocat",
			email: "octo@example.com",
			name: "Octo Cat",
			groups: ["beskid-admins", "dev"],
		});
	});

	it("falls back to sub when preferred_username is absent", () => {
		const user = claimsToShellUser({ sub: "12345" });
		expect(user.username).toBe("12345");
		expect(user.groups).toEqual([]);
		expect(user.email).toBeUndefined();
		expect(user.name).toBeUndefined();
	});

	it("drops non-string group entries", () => {
		const user = claimsToShellUser({
			sub: "octocat",
			groups: ["admins", 42, null, "devs"],
		});
		expect(user.groups).toEqual(["admins", "devs"]);
	});

	it("treats missing groups as empty", () => {
		const user = claimsToShellUser({ preferred_username: "octocat" });
		expect(user.groups).toEqual([]);
	});
});

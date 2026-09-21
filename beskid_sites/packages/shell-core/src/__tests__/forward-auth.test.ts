import { describe, expect, it } from "vitest";

import { shellUserFromForwardAuthHeaders } from "../server";

describe("shellUserFromForwardAuthHeaders", () => {
	it("maps the verified Authentik identity headers", () => {
		const headers = new Headers({
			"x-authentik-username": "octocat",
			"x-authentik-email": "octocat@example.com",
			"x-authentik-name": "The Octocat",
			"x-authentik-groups": "pckg-admins, developers",
		});

		expect(shellUserFromForwardAuthHeaders(headers)).toEqual({
			username: "octocat",
			email: "octocat@example.com",
			name: "The Octocat",
			groups: ["pckg-admins", "developers"],
			avatarUrl: "https://github.com/octocat.png",
		});
	});

	it("returns null when the edge did not authenticate the request", () => {
		expect(shellUserFromForwardAuthHeaders(new Headers())).toBeNull();
	});
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("#/server/db/index", () => ({
	getHubSetting: (key: string) => store.get(key) ?? null,
	setHubSetting: (key: string, value: string) => {
		store.set(key, value);
	},
}));

describe("hub-admin-bootstrap", () => {
	beforeEach(() => {
		store.clear();
		vi.resetModules();
	});

	it("promoteBootstrapAdminIfNeeded sets first login when list is empty", async () => {
		const { promoteBootstrapAdminIfNeeded, getAdminLogins } = await import(
			"#/server/hub-admin-bootstrap.server"
		);

		expect(promoteBootstrapAdminIfNeeded("Alice")).toBe(true);
		expect(getAdminLogins()).toEqual(["alice"]);
	});

	it("promoteBootstrapAdminIfNeeded is case-insensitive", async () => {
		const { promoteBootstrapAdminIfNeeded, getAdminLogins } = await import(
			"#/server/hub-admin-bootstrap.server"
		);

		promoteBootstrapAdminIfNeeded("MyUser");
		expect(getAdminLogins()).toEqual(["myuser"]);
	});

	it("promoteBootstrapAdminIfNeeded is a no-op when admins already exist", async () => {
		store.set("admin_github_logins", JSON.stringify(["existing"]));

		const { promoteBootstrapAdminIfNeeded, getAdminLogins } = await import(
			"#/server/hub-admin-bootstrap.server"
		);

		expect(promoteBootstrapAdminIfNeeded("newbie")).toBe(false);
		expect(getAdminLogins()).toEqual(["existing"]);
	});

	it("addAdminLogin appends unique normalized logins", async () => {
		store.set("admin_github_logins", JSON.stringify(["alpha"]));

		const { addAdminLogin, getAdminLogins } = await import(
			"#/server/hub-admin-bootstrap.server"
		);

		addAdminLogin("Beta");
		addAdminLogin("alpha");
		expect(getAdminLogins()).toEqual(["alpha", "beta"]);
	});

	it("removeAdminLogin drops a login", async () => {
		store.set("admin_github_logins", JSON.stringify(["alpha", "beta"]));

		const { removeAdminLogin, getAdminLogins } = await import(
			"#/server/hub-admin-bootstrap.server"
		);

		removeAdminLogin("Alpha");
		expect(getAdminLogins()).toEqual(["beta"]);
	});
});

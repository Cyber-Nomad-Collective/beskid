import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PckgShell, resolveSidebarItems, USER_MENU_LINKS } from "./pckg-shell";

const user = { username: "octocat", groups: [] };

describe("pckg sidebar navigation", () => {
	it("groups the release center sections under one parent", () => {
		const items = resolveSidebarItems("/dashboard/release/keys");
		const release = items.find((item) => item.id === "release");
		expect(release?.href).toBe("/dashboard/release");
		expect(release?.children?.map((child) => [child.label, child.href])).toEqual([
			["Overview", "/dashboard/release"],
			["Releases", "/dashboard/release/versions"],
			["API keys", "/dashboard/release/keys"],
		]);
	});

	it("activates exactly the section that matches the pathname", () => {
		const active = (pathname: string) =>
			resolveSidebarItems(pathname)
				.flatMap((item) => [item, ...(item.children ?? [])])
				.filter((item) => item.active)
				.map((item) => item.id);
		expect(active("/dashboard/my-packages")).toEqual(["dashboard"]);
		expect(active("/dashboard/release")).toEqual(["release-overview"]);
		expect(active("/dashboard/release/keys")).toEqual(["release-keys"]);
		expect(active("/dashboard/release/versions")).toEqual(["release-versions"]);
		expect(active("/packages/beskid.http")).toEqual(["packages"]);
	});

	it("renders the sub-navigation links in the dashboard shell", () => {
		render(
			<PckgShell sidebarEnabled user={user}>
				<div>page</div>
			</PckgShell>,
		);
		const sub = screen.getByRole("list", { name: "Release center sections" });
		expect(sub).toContainElement(screen.getByRole("link", { name: "API keys" }));
		expect(screen.getByRole("link", { name: "API keys" })).toHaveAttribute(
			"href",
			"/dashboard/release/keys",
		);
		expect(screen.getByRole("link", { name: "Releases" })).toHaveAttribute(
			"href",
			"/dashboard/release/versions",
		);
	});

	it("links the account menu to the dashboard, release center and API keys", () => {
		expect(USER_MENU_LINKS.map((link) => link.href)).toEqual([
			"/dashboard",
			"/dashboard/release",
			"/dashboard/release/keys",
		]);
	});
});

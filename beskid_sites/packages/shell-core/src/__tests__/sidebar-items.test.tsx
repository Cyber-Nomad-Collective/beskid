import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SidebarNavItem } from "../index";
import { AppShell } from "../index";

const items: SidebarNavItem[] = [
	{ id: "home", label: "Home", href: "/", active: true },
	{ id: "bugs", label: "Bugs", href: "/bugs" },
	{
		id: "spec",
		label: "Platform spec",
		href: "https://spec.example.com",
		external: true,
	},
];

describe("AppShell sidebar items", () => {
	it("renders all configured nav items as links", () => {
		render(
			<AppShell sidebarItems={items} sidebarEnabled>
				<div>page</div>
			</AppShell>,
		);

		expect(screen.getByText("Home")).not.toBeNull();
		expect(screen.getByText("Bugs")).not.toBeNull();
		expect(screen.getByText("Platform spec")).not.toBeNull();

		const homeLink = screen.getByText("Home").closest("a");
		expect(homeLink?.getAttribute("href")).toBe("/");
		const specLink = screen.getByText("Platform spec").closest("a");
		expect(specLink?.getAttribute("href")).toBe("https://spec.example.com");
		expect(specLink?.getAttribute("target")).toBe("_blank");
	});

	it("renders no nav items when the config is empty", () => {
		render(
			<AppShell sidebarItems={[]} sidebarEnabled>
				<div>page</div>
			</AppShell>,
		);
		expect(screen.queryByText("Home")).toBeNull();
	});
});

describe("AppShell nested sidebar items", () => {
	const nested: SidebarNavItem[] = [
		{ id: "home", label: "Home", href: "/" },
		{
			id: "release",
			label: "Release center",
			href: "/dashboard/release",
			children: [
				{ id: "overview", label: "Overview", href: "/dashboard/release" },
				{
					id: "keys",
					label: "API keys",
					href: "/dashboard/release/keys",
					active: true,
				},
			],
		},
	];

	it("renders children as a sub-navigation under the parent link", () => {
		render(
			<AppShell sidebarItems={nested} sidebarEnabled>
				<div>page</div>
			</AppShell>,
		);

		const sub = screen.getByRole("list", { name: "Release center sections" });
		expect(sub.getAttribute("data-sidebar")).toBe("menu-sub");
		const keys = screen.getByText("API keys").closest("a");
		expect(keys?.getAttribute("href")).toBe("/dashboard/release/keys");
		expect(sub.contains(keys)).toBe(true);
		expect(screen.getByText("Overview").closest("a")?.getAttribute("href")).toBe(
			"/dashboard/release",
		);
	});

	it("marks the parent active when a child is active", () => {
		render(
			<AppShell sidebarItems={nested} sidebarEnabled>
				<div>page</div>
			</AppShell>,
		);

		const parent = screen.getByText("Release center").closest("a");
		expect(parent?.getAttribute("data-active")).toBe("true");
		expect(
			screen.getByText("API keys").closest("a")?.getAttribute("data-active"),
		).toBe("true");
		expect(
			screen.getByText("Overview").closest("a")?.getAttribute("data-active"),
		).toBe("false");
		expect(
			screen.getByText("Home").closest("a")?.getAttribute("data-active"),
		).toBe("false");
	});
});

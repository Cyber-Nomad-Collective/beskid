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

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SidebarNavItem } from "../index";
import { AppShell } from "../index";

const items: SidebarNavItem[] = [{ id: "home", label: "Home", href: "/" }];

describe("AppShell sidebar show/hide", () => {
	it("renders the sidebar when enabled", () => {
		render(
			<AppShell sidebarItems={items} sidebarEnabled>
				<div>page</div>
			</AppShell>,
		);
		// Sidebar nav item present.
		expect(screen.getByText("Home")).not.toBeNull();
		// Sidebar trigger (collapse button) is present in the topbar.
		expect(
			screen.getAllByRole("button", { name: /toggle sidebar/i }).length,
		).toBeGreaterThan(0);
	});

	it("collapses to topbar-only when disabled (no sidebar nav, no trigger)", () => {
		render(
			<AppShell sidebarItems={items} sidebarEnabled={false}>
				<div>page</div>
			</AppShell>,
		);
		// Sidebar nav items are gone.
		expect(screen.queryByText("Home")).toBeNull();
		// No sidebar trigger in topbar-only mode.
		expect(
			screen.queryAllByRole("button", { name: /toggle sidebar/i }),
		).toHaveLength(0);
		// Body still renders.
		expect(screen.getByText("page")).not.toBeNull();
	});
});

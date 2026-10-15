import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "../index";

describe("AppShell topbar slots", () => {
	it("renders injected left slot content", () => {
		render(
			<AppShell sidebarEnabled={false} leftSlot={<span>Beskid / Shell</span>}>
				<div>page</div>
			</AppShell>,
		);
		expect(screen.getByText("Beskid / Shell")).not.toBeNull();
	});

	it("renders injected right slot content", () => {
		render(
			<AppShell
				sidebarEnabled={false}
				rightSlot={<button type="button">Search</button>}
			>
				<div>page</div>
			</AppShell>,
		);
		expect(screen.getByRole("button", { name: "Search" })).not.toBeNull();
	});

	it("renders both slots together", () => {
		render(
			<AppShell
				sidebarEnabled={false}
				leftSlot={<span>Left</span>}
				rightSlot={<span>Right</span>}
			>
				<div>page</div>
			</AppShell>,
		);
		expect(screen.getByText("Left")).not.toBeNull();
		expect(screen.getByText("Right")).not.toBeNull();
	});
});

describe("AppShell sign-in entry", () => {
	it("offers Sign in in the topbar when nobody is signed in", () => {
		render(
			<AppShell sidebarEnabled={false} signInHref="/auth/start">
				<div>page</div>
			</AppShell>,
		);
		expect(
			screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
		).toBe("/auth/start");
	});

	it("shows the account menu instead once signed in", () => {
		render(
			<AppShell sidebarEnabled={false} user={{ username: "akadmin", groups: [] }}>
				<div>page</div>
			</AppShell>,
		);
		expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
	});
});

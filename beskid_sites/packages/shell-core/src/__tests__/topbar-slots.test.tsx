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

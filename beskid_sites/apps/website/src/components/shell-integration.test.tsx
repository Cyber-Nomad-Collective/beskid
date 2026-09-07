import {
	AppShell,
	TopbarLeftSlot,
	TopbarRightSlot,
} from "@cyber-nomad-collective/beskid-shell-core";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Shell integration — the website is consumer-facing, so the shell runs with
 * `sidebarEnabled={false}` and the Beskid hub in the topbar right slot.
 */
describe("Website shell integration", () => {
	it("renders the topbar-only layout when sidebar is disabled", () => {
		render(
			<AppShell
				sidebarEnabled={false}
				brandLabel="Beskid"
				brandSubtitle="Language & platform"
				homeHref="/"
				leftSlot={
					<TopbarLeftSlot>
						<span data-testid="brand">Beskid</span>
					</TopbarLeftSlot>
				}
				rightSlot={
					<TopbarRightSlot>
						<BeskidHub />
					</TopbarRightSlot>
				}
			>
				<main data-testid="page">page content</main>
			</AppShell>,
		);

		// The page body is rendered.
		expect(screen.getByTestId("page")).toBeInTheDocument();
		// The brand in the left slot is rendered.
		expect(screen.getByTestId("brand")).toBeInTheDocument();
		// The Beskid hub trigger is rendered in the right slot.
		expect(screen.getByTitle("Beskid services")).toBeInTheDocument();
	});

	it("does not render a sidebar nav when sidebar is disabled", () => {
		const { container } = render(
			<AppShell
				sidebarEnabled={false}
				brandLabel="Beskid"
				leftSlot={<TopbarLeftSlot>{null}</TopbarLeftSlot>}
				rightSlot={<TopbarRightSlot>{null}</TopbarRightSlot>}
			>
				<main>content</main>
			</AppShell>,
		);
		// No sidebar landmark should be present in the topbar-only layout.
		expect(container.querySelector("aside, [data-sidebar]")).toBeNull();
	});
});

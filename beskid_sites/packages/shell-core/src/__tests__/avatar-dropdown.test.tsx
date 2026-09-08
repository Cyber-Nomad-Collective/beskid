import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ShellUser } from "../index";
import { AppShell } from "../index";

const user: ShellUser = {
	username: "octocat",
	email: "octo@example.com",
	name: "Octo Cat",
	groups: ["beskid-admins"],
	avatarUrl: "https://github.com/octocat.png",
};

describe("AppShell avatar dropdown (sidebar disabled)", () => {
	it("shows the user's initials in the topbar when the sidebar is disabled", () => {
		render(
			<AppShell sidebarEnabled={false} user={user}>
				<div>page</div>
			</AppShell>,
		);
		// The topbar avatar trigger shows the first two letters of the username
		// (the `uppercase` CSS class does not transform text in jsdom).
		expect(screen.getByLabelText("Account")).not.toBeNull();
		expect(screen.getByText("oc")).not.toBeNull();
	});

	it("does not show the topbar avatar trigger when the sidebar is enabled", () => {
		render(
			<AppShell sidebarEnabled user={user}>
				<div>page</div>
			</AppShell>,
		);
		expect(screen.queryByLabelText("Account")).toBeNull();
		// The user still appears in the sidebar footer.
		expect(screen.getByText("Octo Cat")).not.toBeNull();
	});

	it("does not render the avatar trigger when there is no user", () => {
		render(
			<AppShell sidebarEnabled={false} user={null}>
				<div>page</div>
			</AppShell>,
		);
		expect(screen.queryByLabelText("Account")).toBeNull();
	});
});

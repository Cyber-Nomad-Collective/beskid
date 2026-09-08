import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthGate, UserBadge } from "./AuthGate";

vi.mock("#/lib/auth", async (importOriginal) => ({
	...(await importOriginal<typeof import("#/lib/auth")>()),
	logoutUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@beskid/ui-react", () => ({
	AuthPageShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
		<section aria-label={title}>{children}</section>
	),
	Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
	Button: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@beskid/ui-react/ui/avatar", () => ({
	Avatar: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
	AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
	AvatarImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock("@beskid/ui-react/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div role="menu">{children}</div>,
	DropdownMenuItem: ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean }) => asChild ? children : <button type="button" role="menuitem" {...props}>{children}</button>,
	DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("AuthGate", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("withholds private children when the session is absent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ user: null }), { status: 200 }),
			),
		);

		render(
			<AuthGate requireAuth>{() => <p>Private lesson workspace</p>}</AuthGate>,
		);

		expect(await screen.findByRole("link", { name: "Sign in with GitHub" })).toBeVisible();
		expect(screen.queryByText("Private lesson workspace")).not.toBeInTheDocument();
	});

	it("renders Learn anonymously by default", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ user: null }), { status: 200 }),
			),
		);

		render(<AuthGate>{() => <p>Public lesson workspace</p>}</AuthGate>);

		expect(await screen.findByText("Public lesson workspace")).toBeVisible();
	});

	it("opens an account menu with profile and sign-out actions", () => {
		render(
			<UserBadge
				user={{
					login: "pmikstacki",
					name: "Mikołaj",
					avatarUrl: "https://example.test/avatar.png",
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));

		expect(screen.getByRole("link", { name: "Manage account" })).toHaveAttribute(
			"href",
			"https://auth.beskid-lang.org/profile",
		);
		expect(screen.getByRole("menuitem", { name: "Log out" })).toBeVisible();
	});
});

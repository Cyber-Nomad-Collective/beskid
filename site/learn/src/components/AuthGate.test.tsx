import { render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthGate } from "./AuthGate";

vi.mock("@beskid/ui-react", () => ({
	AuthPageShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
		<section aria-label={title}>{children}</section>
	),
	Button: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
});

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/packages";
const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useRouterState: (opts?: { select?: (s: unknown) => unknown }) => {
		const state = { location: { pathname } };
		return opts?.select ? opts.select(state) : state;
	},
	useNavigate: () => navigateMock,
	Link: ({
		to,
		children,
		...rest
	}: {
		to?: string;
		children?: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={to ?? "#"} {...(rest as Record<string, unknown>)}>
			{children}
		</a>
	),
	useRouteContext: () => ({ user: null }),
}));

describe("ModeSwitcher", () => {
	beforeEach(() => {
		pathname = "/packages";
		navigateMock.mockClear();
	});

	afterEach(() => {
		vi.resetModules();
	});

	it("renders Docs and Registry segments", async () => {
		const { ModeSwitcher } = await import("./mode-switcher");
		render(<ModeSwitcher />);
		expect(screen.getByRole("tab", { name: "Docs" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Registry" })).toBeInTheDocument();
	});

	it("marks Registry active on /packages", async () => {
		const { ModeSwitcher } = await import("./mode-switcher");
		render(<ModeSwitcher />);
		expect(screen.getByRole("tab", { name: "Registry" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "Docs" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	it("marks Docs active on /docs", async () => {
		pathname = "/docs/beskid.http";
		const { ModeSwitcher } = await import("./mode-switcher");
		render(<ModeSwitcher />);
		expect(screen.getByRole("tab", { name: "Docs" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	it("navigates to /docs when Docs is clicked", async () => {
		const { ModeSwitcher } = await import("./mode-switcher");
		render(<ModeSwitcher />);
		fireEvent.click(screen.getByRole("tab", { name: "Docs" }));
		expect(navigateMock).toHaveBeenCalledWith({ to: "/docs" });
	});

	it("navigates to /packages when Registry is clicked from docs mode", async () => {
		pathname = "/docs";
		const { ModeSwitcher } = await import("./mode-switcher");
		render(<ModeSwitcher />);
		fireEvent.click(screen.getByRole("tab", { name: "Registry" }));
		expect(navigateMock).toHaveBeenCalledWith({ to: "/packages" });
	});
});

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Session cookie sealing needs a SESSION_SECRET (32+ chars). Set it before
// any test file imports the server session module (setup files run before
// test-file imports).
process.env.SESSION_SECRET = "test-session-secret-32-chars-min!!";

// jsdom lacks window.matchMedia; the shared SidebarProvider calls useIsMobile
// which uses it. Provide a minimal stub. (Guarded: server tests run in node.)
if (typeof window !== "undefined" && !window.matchMedia) {
	window.matchMedia = (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	});
}

// jsdom lacks ResizeObserver, which cmdk (GlobalSearch) and radix primitives
// rely on. Provide a minimal no-op stub so client component tests render.
if (typeof window !== "undefined" && typeof ResizeObserver === "undefined") {
	class ResizeObserverStub {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
	globalThis.ResizeObserver =
		ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom lacks Element.hasPointerCapture / scrollIntoView used by radix/cmdk.
if (typeof window !== "undefined" && typeof Element !== "undefined") {
	if (!Element.prototype.hasPointerCapture) {
		Element.prototype.hasPointerCapture = () => false;
	}
	if (!Element.prototype.scrollIntoView) {
		Element.prototype.scrollIntoView = () => {};
	}
}

// Mock @tanstack/react-router's router-bound primitives so shell components
// (which use <Link> and useRouteContext) render in isolation under jsdom.
vi.mock("@tanstack/react-router", () => ({
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
	useRouterState: () => ({ location: { pathname: "/" } }),
	useRouteContext: () => ({ user: null }),
	useNavigate: () => () => {},
}));

// next-themes needs a stable no-op in jsdom.
vi.mock("next-themes", () => ({
	useTheme: () => ({
		resolvedTheme: "light",
		setTheme: () => {},
	}),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

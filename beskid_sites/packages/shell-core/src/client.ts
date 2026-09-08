/**
 * SPA-safe client entry — shell components that do NOT depend on
 * `@tanstack/react-router`.
 *
 * Vite SPA apps without TanStack Router (e.g. nexus) import from here. The
 * sidebar-dependent components (`AppShell` / `AppSidebar` / `SidebarNav`,
 * which use `Link` from `@tanstack/react-router`) are intentionally omitted;
 * SPA apps compose the topbar-only layout from `Topbar` + `ShellUiProvider`
 * directly.
 */

export type {
	GlobalSearchProps,
	SearchResult,
} from "./client/global-search";
export { GlobalSearch } from "./client/global-search";
export { ShellUiProvider, useShellUi } from "./client/shell-context";
export { ThemeProvider } from "./client/theme-provider";
export { ThemeToggle } from "./client/theme-toggle";
export { Topbar, TopbarLeftSlot, TopbarRightSlot } from "./client/topbar";
export { TopbarAppShell } from "./client/topbar-app-shell";
export type {
	AnimatedMode,
	AnimatedModeSwitcherProps,
} from "./client/transitions";
export {
	AnimatedModeSwitcher,
	PageTransition,
	usePageTransition,
} from "./client/transitions";
export { UserMenu } from "./client/user-menu";
export type {
	AppShellProps,
	ShellUiContextValue,
	ShellUser,
	ThemeProviderProps,
	TopbarProps,
	UserMenuProps,
} from "./types";

/**
 * Main entry — full client surface for TanStack Start apps.
 *
 * Re-exports all shell client components (including the sidebar-dependent
 * `AppShell` / `AppSidebar` / `SidebarNav`, which import `Link` from
 * `@tanstack/react-router`) plus the shared shell types. TanStack Start apps
 * (shell-template, website, tracker) import from here.
 *
 * SPA apps without `@tanstack/react-router` (e.g. nexus) should import from
 * the `./client` subpath instead, which omits the sidebar-dependent
 * components.
 */

export { AppShell } from "./client/app-shell";
export { AppSidebar } from "./client/app-sidebar";
export type {
	GlobalSearchProps,
	SearchResult,
} from "./client/global-search";
export { GlobalSearch } from "./client/global-search";
export { getContext } from "./client/root-provider";
export { ShellUiProvider, useShellUi } from "./client/shell-context";
export { SidebarNav } from "./client/sidebar-nav";
export { ThemeProvider } from "./client/theme-provider";
export { ThemeToggle } from "./client/theme-toggle";
export { Topbar, TopbarLeftSlot, TopbarRightSlot } from "./client/topbar";
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
	AppSidebarProps,
	ShellAuthConfig,
	ShellAuthMode,
	ShellUiContextValue,
	ShellUser,
	SidebarNavItem,
	ThemeProviderProps,
	TopbarProps,
	UserMenuProps,
} from "./types";

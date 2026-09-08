import type { ComponentType, ReactNode } from "react";

/**
 * Shell user identity.
 *
 * Derived from the verified Authelia ID token on the server (see
 * `server/oidc.ts` + `server/shell-session.ts`) and threaded into the
 * TanStack router context so client components can render the avatar
 * dropdown / sidebar footer without a separate fetch.
 *
 * This module is client-safe (imported by client components): it holds only
 * the type, no server-only logic.
 */
export interface ShellUser {
	/** GitHub login (from the Authelia ID token `preferred_username` / `sub`). */
	username: string;
	/** Email if the ID token carried it (`email` claim). */
	email?: string;
	/** Display name if the ID token carried it (`name` claim). */
	name?: string;
	/** Group memberships (from the ID token `groups` claim). */
	groups: string[];
	/** Avatar URL — Authelia does not provide this; sourced by the app. */
	avatarUrl?: string;
}

/**
 * A configurable sidebar nav item. Apps pass an array of these to `AppShell`
 * instead of hardcoding links (the tracker's Roadmap/Bugs/Platform-spec list
 * becomes config).
 */
export interface SidebarNavItem {
	/** Stable key. */
	id: string;
	/** Visible label. */
	label: string;
	/** Route href (internal `to` or external `href`). */
	href: string;
	/** Lucide icon component, rendered before the label. */
	icon?: ComponentType<{ className?: string }>;
	/** Whether the item is the active route. */
	active?: boolean;
	/** External link opens in a new tab. */
	external?: boolean;
	/** Optional tooltip (defaults to label). */
	tooltip?: string;
}

export interface AppShellProps {
	/** Configurable nav items rendered in the sidebar content. */
	sidebarItems?: SidebarNavItem[];
	/** Show the sidebar (default `true`). When `false`, layout collapses to topbar-only. */
	sidebarEnabled?: boolean;
	/** Authelia-derived user; drives the avatar dropdown (sidebar footer or topbar). */
	user?: ShellUser | null;
	/** Topbar left slot (breadcrumb, kicker, etc.). */
	leftSlot?: ReactNode;
	/** Topbar right slot (search, settings, hub, etc.). */
	rightSlot?: ReactNode;
	/** Optional extra sidebar content below the nav items (dynamic trees, dialogs). */
	sidebarExtra?: ReactNode;
	/** Sign-out href (POST endpoint or Authelia `/logout`). Defaults to `/logout`. */
	signOutHref?: string;
	/** Branding label shown in the sidebar header. */
	brandLabel?: string;
	/** Branding subtitle shown in the sidebar header. */
	brandSubtitle?: string;
	/** Home href for the sidebar header logo link. */
	homeHref?: string;
	children: ReactNode;
}

export interface TopbarProps {
	/** Left slot: breadcrumb, kicker, etc. */
	leftSlot?: ReactNode;
	/** Right slot: search, settings, hub, etc. */
	rightSlot?: ReactNode;
	/** Whether the sidebar trigger is shown (only when sidebar is enabled). */
	showSidebarTrigger?: boolean;
	/** Authelia user; when present and sidebar is disabled, an avatar dropdown renders. */
	user?: ShellUser | null;
	/** Whether to render the avatar dropdown in the topbar (sidebar-disabled mode). */
	showUserMenu?: boolean;
	signOutHref?: string;
}

export interface AppSidebarProps {
	items: SidebarNavItem[];
	user?: ShellUser | null;
	sidebarExtra?: ReactNode;
	signOutHref?: string;
	brandLabel?: string;
	brandSubtitle?: string;
	homeHref?: string;
}

export interface UserMenuProps {
	user: ShellUser;
	/** Trigger element; defaults to an avatar + name row sized for the sidebar footer. */
	trigger?: ReactNode;
	/** Sign-out href (POST endpoint or Authelia `/logout`). */
	signOutHref?: string;
	/** Dropdown alignment side (sidebar uses `top`, topbar uses `bottom`). */
	side?: "top" | "bottom";
}

export interface ShellUiContextValue {
	/** Whether the sidebar is currently open (controlled by the shell). */
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
}

export interface ThemeProviderProps {
	children: ReactNode;
	/** Default theme. Defaults to `system`; SPA apps may pass `dark`. */
	defaultTheme?: string;
}

/**
 * Auth mode for the shell.
 *
 * - `authelia` (production): read identity from the signed session cookie
 *   set after the Authelia OIDC authorization-code flow completes.
 * - `mock` (local dev): return a fake user so the shell renders without an
 *   Authelia instance in front of it.
 */
export type ShellAuthMode = "authelia" | "mock";

/**
 * Per-app OIDC + session configuration passed to {@link createShellAuth}.
 *
 * Each app reads its own env (e.g. `SHELL_TEMPLATE_OIDC_CLIENT_ID`,
 * `PLATFORM_SPEC_OIDC_CLIENT_ID`, `TRACKER_OIDC_CLIENT_ID`) and passes the
 * resolved values here. The shell-core package never reads app env directly.
 */
export interface ShellAuthConfig {
	/** Authelia OIDC issuer origin (e.g. `http://localhost:9091`). */
	issuer: string;
	/** This app's OIDC client id (registered in Authelia). */
	clientId: string;
	/** This app's OIDC client secret (from Authelia client config). */
	clientSecret: string;
	/** Session cookie signing key (HS256, 32+ chars). Required in production. */
	sessionSecret: string;
	/** Session cookie name. Defaults to `beskid_shell_session`. */
	sessionCookieName?: string;
	/** OIDC state cookie name. Defaults to `beskid_shell_oidc_state`. */
	oidcStateCookieName?: string;
	/** Whether cookies should carry the `Secure` flag (production). */
	isProduction: boolean;
}

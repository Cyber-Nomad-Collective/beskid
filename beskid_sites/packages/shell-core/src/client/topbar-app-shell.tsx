"use client";

import { TooltipProvider } from "@cyber-nomad-collective/beskid-ui-react";

import type { AppShellProps } from "../types";
import { ShellUiProvider } from "./shell-context";
import { Topbar } from "./topbar";

/**
 * Topbar-only app shell for SPA apps without `@tanstack/react-router`.
 *
 * Mirrors the `sidebarEnabled={false}` branch of {@link AppShell} but omits
 * the sidebar entirely (no `AppSidebar` / `SidebarNav` import, so no
 * `@tanstack/react-router` dependency). Vite SPA apps (e.g. nexus) compose
 * their services into the `leftSlot` / `rightSlot` render areas.
 */
export function TopbarAppShell({
	user = null,
	leftSlot,
	rightSlot,
	signOutHref,
	children,
}: AppShellProps) {
	return (
		<ShellUiProvider>
			<TooltipProvider>
				<div className="app-shell__inset flex min-h-0 flex-col">
					<Topbar
						leftSlot={leftSlot}
						rightSlot={rightSlot}
						showUserMenu
						user={user}
						signOutHref={signOutHref}
					/>
					<div className="app-shell__body flex min-h-0 flex-1">
						<div className="app-shell__main flex min-h-0 min-w-0 flex-1 flex-col">
							{children}
						</div>
					</div>
				</div>
			</TooltipProvider>
		</ShellUiProvider>
	);
}

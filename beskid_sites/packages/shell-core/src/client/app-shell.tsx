"use client";

import {
	SidebarInset,
	SidebarProvider,
	TooltipProvider,
} from "@cyber-nomad-collective/beskid-ui-react";

import type { AppShellProps } from "../types";
import { AppSidebar } from "./app-sidebar";
import { ShellUiProvider } from "./shell-context";
import { Topbar } from "./topbar";

export type { AppShellProps };

/**
 * Generic reusable app shell — the base for all Beskid websites.
 *
 * Wraps `ShellUiProvider` > (`SidebarProvider` + `AppSidebar` + `SidebarInset`
 * when the sidebar is enabled, or a topbar-only layout when disabled). The
 * topbar exposes `leftSlot` / `rightSlot` render areas where consuming apps
 * inject their own services (search, settings, hub). `BeskidHub` is rendered
 * by the app in the right slot (the shell does not hardcode it).
 */
export function AppShell({
	sidebarItems = [],
	sidebarEnabled = true,
	user = null,
	leftSlot,
	rightSlot,
	sidebarExtra,
	signOutHref,
	brandLabel,
	brandSubtitle,
	homeHref,
	children,
}: AppShellProps) {
	return (
		<ShellUiProvider>
			<TooltipProvider>
				{sidebarEnabled ? (
					<SidebarProvider defaultOpen>
						<AppSidebar
							items={sidebarItems}
							user={user}
							sidebarExtra={sidebarExtra}
							signOutHref={signOutHref}
							brandLabel={brandLabel}
							brandSubtitle={brandSubtitle}
							homeHref={homeHref}
						/>
						<SidebarInset className="app-shell__inset flex min-h-0 flex-col">
							<Topbar
								leftSlot={leftSlot}
								rightSlot={rightSlot}
								showSidebarTrigger
								user={user}
								showUserMenu={false}
								signOutHref={signOutHref}
							/>
							<div className="app-shell__body flex min-h-0 flex-1">
								<div className="app-shell__main flex min-h-0 min-w-0 flex-1 flex-col">
									{children}
								</div>
							</div>
						</SidebarInset>
					</SidebarProvider>
				) : (
					<div className="app-shell__inset flex min-h-0 flex-col">
						<Topbar
							leftSlot={leftSlot}
							rightSlot={rightSlot}
							showSidebarTrigger={false}
							user={user}
							showUserMenu
							signOutHref={signOutHref}
						/>
						<div className="app-shell__body flex min-h-0 flex-1">
							<div className="app-shell__main flex min-h-0 min-w-0 flex-1 flex-col">
								{children}
							</div>
						</div>
					</div>
				)}
			</TooltipProvider>
		</ShellUiProvider>
	);
}

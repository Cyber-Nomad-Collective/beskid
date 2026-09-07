"use client";

import {
	Separator,
	SidebarTrigger,
} from "@cyber-nomad-collective/beskid-ui-react";

import type { TopbarProps } from "../types";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export type { TopbarProps };

/**
 * Fixed topbar (h-14, border-b) with left + right slot render areas.
 *
 * When the sidebar is disabled, the avatar dropdown lives here instead of
 * the sidebar footer. `leftSlot` / `rightSlot` are render props where
 * consuming apps inject their own services (search, settings, hub).
 */
export function Topbar({
	leftSlot,
	rightSlot,
	showSidebarTrigger = false,
	user,
	showUserMenu = false,
	signOutHref,
}: TopbarProps) {
	return (
		<header className="app-shell__header flex h-14 shrink-0 items-center border-b border-border px-4">
			<div className="flex min-w-0 items-center gap-2">
				{showSidebarTrigger ? (
					<>
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 h-6" />
					</>
				) : null}
				{leftSlot}
			</div>
			<div className="ml-auto flex min-w-0 max-w-2xl flex-1 items-center justify-end gap-2">
				{rightSlot}
				{showUserMenu && user ? (
					<UserMenu
						user={user}
						signOutHref={signOutHref}
						side="bottom"
						trigger={
							<button
								type="button"
								aria-label="Account"
								className="inline-flex size-8 items-center justify-center rounded-md border border-border"
							>
								<span className="text-xs font-medium uppercase">
									{user.username.slice(0, 2)}
								</span>
							</button>
						}
					/>
				) : null}
				<ThemeToggle />
			</div>
		</header>
	);
}

/**
 * Typed slot components for consuming apps. Apps compose these into the
 * `leftSlot` / `rightSlot` props, or just pass arbitrary `ReactNode`.
 */
export function TopbarLeftSlot({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

export function TopbarRightSlot({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

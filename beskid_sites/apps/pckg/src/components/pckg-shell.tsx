import {
	AppShell,
	type ShellUser,
	type SidebarNavItem,
	TopbarLeftSlot,
	TopbarRightSlot,
} from "@cyber-nomad-collective/beskid-shell-core";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import { useRouterState } from "@tanstack/react-router";
import { BookOpen, LayoutDashboard, Package } from "lucide-react";
import type { ReactNode } from "react";
import { GlobalSearch } from "./global-search";
import { ModeSwitcher } from "./mode-switcher";

const SIDEBAR_ITEMS: SidebarNavItem[] = [
	{ id: "packages", label: "Packages", href: "/packages", icon: Package },
	{ id: "docs", label: "Docs", href: "/docs", icon: BookOpen },
	{
		id: "dashboard",
		label: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
	},
];

/**
 * Shared pckg shell — wraps the shell-core `AppShell` with the pckg topbar
 * (mode switcher left, global search + hub right) and the sidebar nav.
 *
 * `sidebarEnabled` is `true` only for the dashboard routes (pckg is the only
 * Beskid app with a sidebar); consumer-facing routes pass `false` so the layout
 * collapses to topbar-only with the avatar dropdown.
 */
export function PckgShell({
	sidebarEnabled,
	user,
	children,
}: {
	sidebarEnabled: boolean;
	user: ShellUser | null;
	children: ReactNode;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const items = SIDEBAR_ITEMS.map((item) => ({
		...item,
		active:
			item.id === "packages"
				? pathname.startsWith("/packages")
				: item.id === "docs"
					? pathname.startsWith("/docs")
					: pathname.startsWith("/dashboard"),
	}));

	return (
		<AppShell
			sidebarItems={items}
			sidebarEnabled={sidebarEnabled}
			user={user}
			brandLabel="Beskid"
			brandSubtitle="pckg"
			homeHref="/"
			signOutHref="/api/auth/logout"
			leftSlot={
				<TopbarLeftSlot>
					<ModeSwitcher />
				</TopbarLeftSlot>
			}
			rightSlot={
				<TopbarRightSlot>
					<GlobalSearch />
					<BeskidHub />
				</TopbarRightSlot>
			}
		>
			{children}
		</AppShell>
	);
}

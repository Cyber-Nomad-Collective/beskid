import {
	AppShell,
	GlobalSearch,
	type ShellUser,
	type SidebarNavItem,
	TopbarLeftSlot,
	TopbarRightSlot,
} from "@cyber-nomad-collective/beskid-shell-core";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
	BookOpen,
	KeyRound,
	LayoutDashboard,
	ListChecks,
	Package,
	Rocket,
	Tags,
} from "lucide-react";
import type { ReactNode } from "react";
import { pckgApi } from "#/lib/api";
import { ModeSwitcher } from "./mode-switcher";

/** Signed-in entry points from the account menu on public pages. */
export const USER_MENU_LINKS = [
	{ label: "Dashboard", href: "/dashboard" },
	{ label: "Release center", href: "/dashboard/release" },
	{ label: "API keys", href: "/dashboard/release/keys" },
];

const within = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);

/**
 * Sidebar navigation for the given pathname. The release center is a group
 * whose sub-items (Overview, Releases, API keys) are the dashboard's
 * secondary navigation; "Dashboard" itself covers the remaining dashboard
 * pages (my packages).
 */
export function resolveSidebarItems(pathname: string): SidebarNavItem[] {
	const inRelease = within(pathname, "/dashboard/release");
	return [
		{
			id: "packages",
			label: "Packages",
			href: "/packages",
			icon: Package,
			active: within(pathname, "/packages"),
		},
		{
			id: "docs",
			label: "Docs",
			href: "/docs",
			icon: BookOpen,
			active: within(pathname, "/docs"),
		},
		{
			id: "dashboard",
			label: "Dashboard",
			href: "/dashboard",
			icon: LayoutDashboard,
			active: within(pathname, "/dashboard") && !inRelease,
		},
		{
			id: "release",
			label: "Release center",
			href: "/dashboard/release",
			icon: Rocket,
			children: [
				{
					id: "release-overview",
					label: "Overview",
					href: "/dashboard/release",
					icon: ListChecks,
					active: pathname === "/dashboard/release",
				},
				{
					id: "release-versions",
					label: "Releases",
					href: "/dashboard/release/versions",
					icon: Tags,
					active: within(pathname, "/dashboard/release/versions"),
				},
				{
					id: "release-keys",
					label: "API keys",
					href: "/dashboard/release/keys",
					icon: KeyRound,
					active: within(pathname, "/dashboard/release/keys"),
				},
			],
		},
	];
}

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
	const navigate = useNavigate();
	const items = resolveSidebarItems(pathname);

	return (
		<AppShell
			sidebarItems={items}
			sidebarEnabled={sidebarEnabled}
			user={user}
			brandLabel="Beskid"
			brandSubtitle="pckg"
			homeHref="/"
			signOutHref="/api/auth/logout"
			userMenuLinks={USER_MENU_LINKS}
			leftSlot={
				<TopbarLeftSlot>
					<ModeSwitcher />
				</TopbarLeftSlot>
			}
			rightSlot={
				<TopbarRightSlot>
					<GlobalSearch
						placeholder="Search packages"
						storageKey="pckg:recent-searches"
						searchFn={async (query) => {
							const packages = await pckgApi.listPackages({ query });
							return packages.map((item) => ({
								id: item.id,
								title: item.name,
								subtitle: item.description,
								url: `/packages/${encodeURIComponent(item.name)}`,
								category: "Packages",
							}));
						}}
						navigate={(url) => void navigate({ href: url })}
					/>
					<BeskidHub />
				</TopbarRightSlot>
			}
		>
			{children}
		</AppShell>
	);
}

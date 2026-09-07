import {
	AppShell,
	type ShellUser,
	type SidebarNavItem,
	TopbarLeftSlot,
	TopbarRightSlot,
} from "@cyber-nomad-collective/beskid-shell-core";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import {
	createFileRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { Bug, FileText, MapIcon } from "lucide-react";
import { useState } from "react";
import { ReportIssueDialog } from "#/components/report-issue-dialog";
import { RoadmapGlobalSearch } from "#/components/roadmap-global-search";
import { RoadmapNavTree } from "#/components/roadmap-nav-tree";
import {
	TrackerShellVersionProvider,
	useShellVersion,
} from "#/components/shell-versions-sync";
import {
	TrackerSettingsDialog,
	TrackerSettingsHeaderButton,
} from "#/components/tracker-settings-dialog";
import { DialogTrigger } from "#/components/ui/dialog";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "#/components/ui/sidebar";
import { PLATFORM_SPEC_ORIGIN } from "#/lib/beskid-docs-origin";
import { DEFAULT_DELIVERY_VERSIONS } from "#/lib/github/roadmap-labels";
import type { AuthUser } from "#/lib/github/types";
import type { RoadmapCatalogVersion } from "#/lib/roadmap/types";
import { getRoadmapCatalog, getRoadmapSearchIndex } from "#/server/catalog";
import { getSessionInfo } from "#/server/roadmap";

export const Route = createFileRoute("/_shell")({
	beforeLoad: async ({ context }) => {
		const shellUser: ShellUser | null = context.user ?? null;
		const [catalog, searchIndex, session] = await Promise.all([
			getRoadmapCatalog(),
			getRoadmapSearchIndex(),
			getSessionInfo(),
		]);
		const authUser: AuthUser | null = session.user;
		return {
			shellUser,
			authUser,
			catalog,
			searchIndex,
			canManageRoadmap: session.canManage,
		};
	},
	component: ShellLayout,
});

const STATIC_SIDEBAR_ITEMS: SidebarNavItem[] = [
	{ id: "roadmap", label: "Roadmap", href: "/", icon: MapIcon },
	{ id: "bugs", label: "Bugs", href: "/bugs", icon: Bug },
	{
		id: "platform-spec",
		label: "Platform spec",
		href: `${PLATFORM_SPEC_ORIGIN}/platform-spec/`,
		icon: FileText,
		external: true,
	},
];

function ShellLayout() {
	const { shellUser, authUser, catalog, searchIndex, canManageRoadmap } =
		Route.useRouteContext();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [settingsOpen, setSettingsOpen] = useState(false);

	const onRoadmapHome = pathname === "/";
	const onBugs = pathname.startsWith("/bugs");
	const globalView = onBugs;

	const sidebarItems = STATIC_SIDEBAR_ITEMS.map((item) => ({
		...item,
		active:
			item.id === "roadmap" ? onRoadmapHome : item.id === "bugs" ? onBugs : false,
	}));

	return (
		<TrackerShellVersionProvider>
			<AppShell
				sidebarItems={sidebarItems}
				sidebarEnabled
				user={shellUser}
				brandLabel="Beskid"
				brandSubtitle="Tracker"
				homeHref="/"
				signOutHref="/api/auth/logout"
				leftSlot={
					<TopbarLeftSlot>
						<p className="island-kicker hidden shrink-0 sm:block">Beskid</p>
						<span className="text-muted-foreground hidden sm:inline">/</span>
						<span className="hidden truncate font-semibold md:inline">Tracker</span>
					</TopbarLeftSlot>
				}
				rightSlot={
					<TopbarRightSlot>
						<RoadmapGlobalSearch hits={searchIndex} />
						{authUser ? (
							<TrackerSettingsHeaderButton
								open={settingsOpen}
								onOpenChange={setSettingsOpen}
							/>
						) : null}
						<BeskidHub />
					</TopbarRightSlot>
				}
				sidebarExtra={
					<TrackerSidebarExtra
						versions={catalog.versions}
						authUser={authUser}
						pathname={pathname}
						globalView={globalView}
					/>
				}
			>
				<Outlet />
			</AppShell>
			{authUser ? (
				<TrackerSettingsDialog
					open={settingsOpen}
					onOpenChange={setSettingsOpen}
					canManage={canManageRoadmap}
				/>
			) : null}
		</TrackerShellVersionProvider>
	);
}

function TrackerSidebarExtra({
	versions,
	authUser,
	pathname,
	globalView,
}: {
	versions: RoadmapCatalogVersion[];
	authUser: AuthUser | null;
	pathname: string;
	globalView: boolean;
}) {
	const { version: routeVersion } = useShellVersion();
	const fallbackVersions: RoadmapCatalogVersion[] =
		versions.length > 0
			? versions
			: DEFAULT_DELIVERY_VERSIONS.map((id, index) => ({
					id,
					title: `Delivery ${id}`,
					summary: "Roadmap delivery version.",
					theme: "",
					status:
						index < DEFAULT_DELIVERY_VERSIONS.length - 1 ? "Released" : "In Progress",
					cutoff: {
						startDate: "2026-01-01",
						endDate: "2026-12-31",
						endCommitSha: "0000000",
					},
					deliverables: [],
					workstreams: [],
					stats: {
						tasksTotal: 0,
						tasksDone: 0,
						tasksInProgress: 0,
						tasksBacklog: 0,
						deliverablesTotal: 0,
						deliverablesClosed: 0,
						workstreamsTotal: 0,
						commitsTracked: 0,
					},
				}));
	const activeVersionId =
		routeVersion ??
		(pathname.match(/\/versions\/([^/]+)/)?.[1] as string | undefined) ??
		(pathname.match(/\/v\/([^/]+)/)?.[1] as string | undefined) ??
		DEFAULT_DELIVERY_VERSIONS[1];
	const selectedVersion =
		fallbackVersions.find((v) => v.id === activeVersionId) ??
		fallbackVersions.at(-1) ??
		fallbackVersions[0];

	return (
		<>
			{!globalView ? (
				<RoadmapNavTree
					version={selectedVersion}
					versions={fallbackVersions}
					user={authUser}
					pathname={pathname}
				/>
			) : null}
			<SidebarGroup className="group-data-[collapsible=icon]:hidden">
				<SidebarGroupLabel>Report</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<ReportIssueDialog
								user={authUser}
								trigger={
									<SidebarMenuButton tooltip="Report a bug" asChild>
										<DialogTrigger>
											<Bug />
											<span>Report a bug</span>
										</DialogTrigger>
									</SidebarMenuButton>
								}
							/>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	);
}

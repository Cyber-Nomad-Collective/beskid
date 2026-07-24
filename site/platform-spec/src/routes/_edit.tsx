import {
	Link,
	Outlet,
	createFileRoute,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import {
	Edit,
	FileText,
	LogOut,
	ShieldCheck,
} from "lucide-react";

import { ThemeToggle } from "#/components/theme-toggle";
import { getAuthUser } from "#/server/auth";
import { getAuthHubPairingStatusFn } from "#/server/auth-hub-pairing";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	BeskidHub,
	Separator,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@beskid/ui-react";

export const Route = createFileRoute("/_edit")({
	beforeLoad: async ({ location }) => {
		const { paired } = await getAuthHubPairingStatusFn();
		if (!paired) {
			throw redirect({ to: "/settings/auth/pair" });
		}

		const user = await getAuthUser();
		if (!user) {
			throw redirect({
				to: "/settings/auth/login",
				search: { next: location.pathname },
			});
		}

		return { user };
	},
	component: EditShell,
});

function EditShell() {
	const { user } = Route.useRouteContext();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<SidebarProvider defaultOpen>
			<Sidebar collapsible="icon" variant="sidebar">
				<SidebarHeader className="border-b border-sidebar-border">
					<div className="flex items-center px-2 pt-4 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
						<SidebarMenu className="min-w-0 flex-1 group-data-[collapsible=icon]:flex-none">
							<SidebarMenuItem>
								<SidebarMenuButton size="lg" asChild className="mb-1">
									<Link
										to="/platform-spec/$"
										params={{ _splat: "" }}
									>
										<img
											src="/favicon.svg"
											alt=""
											width={28}
											height={28}
											className="size-7 shrink-0 rounded-md"
										/>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">Beskid</span>
											<span className="truncate text-xs text-sidebar-foreground/70">
												Platform Spec
											</span>
										</div>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Navigate</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith("/platform-spec")}
										tooltip="Specification"
									>
										<Link to="/platform-spec/$" params={{ _splat: "" }}>
											<FileText />
											<span>Specification</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={
											pathname === "/edit" || pathname.startsWith("/edit/")
										}
										tooltip="Drafts"
									>
										<Link to="/edit">
											<Edit />
											<span>Drafts</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith("/moderation")}
										tooltip="Moderation"
									>
										<Link to="/moderation">
											<ShieldCheck />
											<span>Moderation</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="border-t border-sidebar-border">
					<SidebarMenu>
						<SidebarMenuItem>
							<div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
								<span className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:sr-only">
									Theme
								</span>
								<ThemeToggle />
							</div>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton
								size="lg"
								className="pointer-events-none"
							>
								<Avatar className="size-8 rounded-lg">
									<AvatarImage src={user.avatarUrl} alt={user.login} />
									<AvatarFallback className="rounded-lg">
										{user.login.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.login}</span>
									<span className="truncate text-xs text-sidebar-foreground/70">
										GitHub account
									</span>
								</div>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip="Sign out">
								<a href="/api/auth/logout">
									<LogOut />
									<span>Sign out</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>

			<SidebarInset>
				<header className="flex h-14 shrink-0 items-center border-b px-4 gap-3">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-6" />
					<span className="text-sm font-semibold">Platform Spec</span>
					<div className="ml-auto flex items-center gap-3">
						<BeskidHub />
						<span className="text-sm text-muted-foreground">
							@{user.login}
						</span>
						<a
							href="/api/auth/logout"
							className="text-sm text-muted-foreground hover:underline"
						>
							Sign out
						</a>
					</div>
				</header>
				<main className="p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

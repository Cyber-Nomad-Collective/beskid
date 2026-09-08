"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";

import type { AppSidebarProps, SidebarNavItem } from "../types";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export type { AppSidebarProps, SidebarNavItem };

/**
 * Generic sidebar: branding header, configurable nav items, optional extra
 * content, and a footer with theme toggle + user dropdown (or sign-in link).
 */
export function AppSidebar({
	items,
	user,
	sidebarExtra,
	signOutHref,
	brandLabel = "Beskid",
	brandSubtitle = "Shell",
	homeHref = "/",
}: AppSidebarProps) {
	return (
		<Sidebar collapsible="icon" variant="sidebar">
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="flex items-center px-2 pt-4 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
					<SidebarMenu className="min-w-0 flex-1 group-data-[collapsible=icon]:flex-none">
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild className="mb-1">
								<Link to={homeHref}>
									<img
										src="/favicon.svg"
										alt=""
										width={28}
										height={28}
										className="size-7 shrink-0 rounded-md"
									/>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">{brandLabel}</span>
										<span className="truncate text-xs text-sidebar-foreground/70">
											{brandSubtitle}
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
					<SidebarGroupContent>
						<SidebarNav items={items} />
					</SidebarGroupContent>
				</SidebarGroup>
				{sidebarExtra}
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
					{user ? (
						<SidebarMenuItem>
							<UserMenu user={user} signOutHref={signOutHref} side="top" />
						</SidebarMenuItem>
					) : (
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip="Sign in">
								<a href="/api/auth/login">Sign in with GitHub</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

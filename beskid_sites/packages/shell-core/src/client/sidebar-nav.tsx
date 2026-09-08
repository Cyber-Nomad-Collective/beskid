"use client";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";

import type { SidebarNavItem } from "../types";

/**
 * Renders configurable {@link SidebarNavItem}s in the sidebar content.
 * Apps pass the config via `AppShell`'s `sidebarItems` prop.
 */
export function SidebarNav({ items }: { items: SidebarNavItem[] }) {
	return (
		<SidebarMenu>
			{items.map((item) => {
				const Icon = item.icon;
				const tooltip = item.tooltip ?? item.label;
				return (
					<SidebarMenuItem key={item.id}>
						<SidebarMenuButton asChild isActive={item.active} tooltip={tooltip}>
							{item.external ? (
								<a href={item.href} target="_blank" rel="noreferrer">
									{Icon ? <Icon className="size-4" /> : null}
									<span>{item.label}</span>
								</a>
							) : (
								<Link to={item.href}>
									{Icon ? <Icon className="size-4" /> : null}
									<span>{item.label}</span>
								</Link>
							)}
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}

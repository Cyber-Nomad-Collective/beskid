"use client";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import type { SidebarNavItem } from "../types";

/** A parent is active when it or any of its descendants is active. */
export function isSidebarItemActive(item: SidebarNavItem): boolean {
	return Boolean(item.active) || (item.children ?? []).some(isSidebarItemActive);
}

/**
 * Link body for one item. `Slot` (via `asChild`) merges the menu button's
 * className and data attributes into this element's props, so they must be
 * forwarded to the rendered anchor.
 */
function NavLink({
	item,
	...slotProps
}: { item: SidebarNavItem } & Omit<ComponentProps<"a">, "href" | "children">) {
	const Icon = item.icon;
	const body = (
		<>
			{Icon ? <Icon className="size-4" /> : null}
			<span>{item.label}</span>
		</>
	);
	return item.external ? (
		<a {...slotProps} href={item.href} target="_blank" rel="noreferrer">
			{body}
		</a>
	) : (
		<Link {...slotProps} to={item.href}>
			{body}
		</Link>
	);
}

/**
 * Renders configurable {@link SidebarNavItem}s in the sidebar content.
 * Apps pass the config via `AppShell`'s `sidebarItems` prop. Items with
 * `children` render a nested sub-navigation (one level) under the parent.
 */
export function SidebarNav({ items }: { items: SidebarNavItem[] }) {
	return (
		<SidebarMenu>
			{items.map((item) => {
				const tooltip = item.tooltip ?? item.label;
				const children = item.children ?? [];
				return (
					<SidebarMenuItem key={item.id}>
						<SidebarMenuButton
							asChild
							isActive={isSidebarItemActive(item)}
							tooltip={tooltip}
						>
							<NavLink item={item} />
						</SidebarMenuButton>
						{children.length > 0 ? (
							<SidebarMenuSub aria-label={`${item.label} sections`}>
								{children.map((child) => (
									<SidebarMenuSubItem key={child.id}>
										<SidebarMenuSubButton asChild isActive={Boolean(child.active)}>
											<NavLink item={child} />
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								))}
							</SidebarMenuSub>
						) : null}
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}

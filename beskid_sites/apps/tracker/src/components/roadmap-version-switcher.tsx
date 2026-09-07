"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, Layers } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "#/components/ui/sidebar";
import type { RoadmapCatalogVersion } from "#/lib/roadmap/types";
import {
	versionStatusBadgeVariant,
	versionStatusLabel,
} from "#/lib/roadmap/version-status";

interface RoadmapVersionSwitcherProps {
	versions: RoadmapCatalogVersion[];
	currentId: string;
	/** Compact row for sidebar group header (matches nav group density). */
	variant?: "header" | "default";
}

export function RoadmapVersionSwitcher({
	versions,
	currentId,
	variant = "default",
}: RoadmapVersionSwitcherProps) {
	const navigate = useNavigate();
	const current =
		versions.find((v) => v.id === currentId) ?? versions[0] ?? null;

	if (!current) {
		return null;
	}

	const isHeader = variant === "header";

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size={isHeader ? "default" : "lg"}
							className={
								isHeader
									? "roadmap-version-switcher roadmap-version-switcher--header h-8 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									: "roadmap-version-switcher data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							}
							tooltip={isHeader ? `Delivery ${current.id}` : undefined}
						>
							{isHeader ? (
								<Layers className="size-4 shrink-0 opacity-70" />
							) : (
								<div className="roadmap-version-switcher__icon flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Layers className="size-4" />
								</div>
							)}
							<span className="truncate font-medium">
								{current.id}
								{isHeader ? (
									<span className="text-sidebar-foreground/70 font-normal">
										{" "}
										· roadmap
									</span>
								) : null}
							</span>
							{!isHeader ? (
								<span className="truncate text-xs text-sidebar-foreground/70">
									{current.title}
								</span>
							) : null}
							<ChevronsUpDown className="ml-auto size-4 opacity-60" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="roadmap-version-switcher__menu w-(--radix-dropdown-menu-trigger-width) min-w-72 rounded-lg"
						align="start"
						side="bottom"
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							Delivery versions
						</DropdownMenuLabel>
						{versions
							.filter((version): version is RoadmapCatalogVersion =>
								Boolean(version?.id),
							)
							.map((version) => (
								<DropdownMenuItem
									key={version.id}
									className="roadmap-version-switcher__item cursor-pointer gap-2 p-2"
									onSelect={() =>
										navigate({
											to: "/versions/$version",
											params: { version: version.id },
										})
									}
								>
									<div className="flex size-6 items-center justify-center rounded-md border border-border">
										<span className="font-mono text-[10px] font-bold">
											{version.id.replace("v", "")}
										</span>
									</div>
									<div className="flex min-w-0 flex-1 flex-col gap-0.5">
										<div className="flex items-center gap-2">
											<span className="font-medium">{version.id}</span>
											<Badge
												variant={versionStatusBadgeVariant(version.status)}
												className="h-5 px-1.5 text-[10px]"
											>
												{versionStatusLabel(version.status)}
											</Badge>
										</div>
										<span className="text-muted-foreground line-clamp-2 text-xs leading-snug">
											{version.summary}
										</span>
									</div>
								</DropdownMenuItem>
							))}
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild className="cursor-pointer">
							<Link to="/">View full roadmap</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

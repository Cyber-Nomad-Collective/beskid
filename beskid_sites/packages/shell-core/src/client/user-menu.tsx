"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@cyber-nomad-collective/beskid-ui-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@cyber-nomad-collective/beskid-ui-react/ui/dropdown-menu";
import { ChevronUp, ExternalLink, LogOut } from "lucide-react";

import type { UserMenuProps } from "../types";

/**
 * Avatar dropdown with user data (name, GitHub profile link, sign-out).
 *
 * Parameterized on the Authelia {@link ShellUser} shape. Used both in the
 * sidebar footer (sidebar enabled) and the topbar (sidebar disabled).
 */
export function UserMenu({
	user,
	trigger,
	signOutHref = "/api/auth/logout",
	side = "top",
}: UserMenuProps) {
	const fallback = user.username.slice(0, 2).toUpperCase();
	const avatarUrl = user.avatarUrl ?? `https://github.com/${user.username}.png`;

	const defaultTrigger = (
		<button
			type="button"
			className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left"
		>
			<Avatar className="size-8 rounded-lg">
				<AvatarImage src={avatarUrl} alt={user.username} />
				<AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
			</Avatar>
			<div className="grid flex-1 text-left text-sm leading-tight">
				<span className="truncate font-medium">{user.name ?? user.username}</span>
				<span className="truncate text-xs text-muted-foreground">
					{user.email ?? "GitHub account"}
				</span>
			</div>
			<ChevronUp className="ml-auto size-4" />
		</button>
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{trigger ?? defaultTrigger}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-56 rounded-lg"
				side={side}
				align="end"
				sideOffset={4}
			>
				<div className="px-2 py-1.5 text-sm">
					<p className="font-medium">{user.name ?? user.username}</p>
					<p className="truncate text-xs text-muted-foreground">
						{user.email ?? user.username}
					</p>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<a
						href={`https://github.com/${user.username}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<ExternalLink className="size-4" />
						GitHub profile
					</a>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<form action={signOutHref} method="post" className="w-full">
						<button
							type="submit"
							className="flex w-full cursor-pointer items-center gap-2"
						>
							<LogOut className="size-4" />
							Sign out
						</button>
					</form>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

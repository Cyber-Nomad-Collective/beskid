import { AuthPageShell, Badge, Button } from "@beskid/ui-react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@beskid/ui-react/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@beskid/ui-react/ui/dropdown-menu";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthUser } from "#/lib/auth";
import {
	authHubLoginUrl,
	authHubProfileUrl,
	fetchAuthUser,
	logoutUser,
} from "#/lib/auth";

export interface AuthGateProps {
	children: (user: AuthUser | null) => React.ReactNode;
	requireAuth?: boolean;
}

export function AuthGate({ children, requireAuth = false }: AuthGateProps) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchAuthUser().then((u) => {
			setUser(u);
			setLoading(false);
		});
	}, []);

	if (loading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<p className="text-muted-foreground text-sm">Checking session…</p>
			</div>
		);
	}

	if (requireAuth && !user) {
		return (
			<AuthPageShell
				kicker="Beskid"
				title="Learn"
				description="Sign in with GitHub through the Beskid auth hub to track your progress and access all lessons."
				footer={
					<a
						href={authHubProfileUrl()}
						className="underline-offset-4 hover:underline text-sm"
					>
						Beskid account
					</a>
				}
			>
				<Button size="lg" asChild className="w-full">
					<a href={authHubLoginUrl()}>Sign in with GitHub</a>
				</Button>
			</AuthPageShell>
		);
	}

	return <>{children(user)}</>;
}

export function UserBadge({ user }: { user: AuthUser }) {
	const displayName = user.name?.trim() || user.login;
	const initials = displayName
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="learn-profile-trigger"
					aria-label="Open account menu"
				>
					<Avatar size="sm">
						<AvatarImage src={user.avatarUrl} alt="" />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<span className="learn-profile-trigger__name">{user.login}</span>
					<ChevronDown aria-hidden="true" className="size-3.5" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="learn-profile-menu">
				<DropdownMenuLabel>
					<div className="learn-profile-menu__identity">
						<span>{displayName}</span>
						<span>@{user.login}</span>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<a href={authHubProfileUrl()}>
						<UserRound />
						Manage account
					</a>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onSelect={(event) => {
						event.preventDefault();
						void logoutUser().then(() => window.location.reload());
					}}
				>
					<LogOut />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

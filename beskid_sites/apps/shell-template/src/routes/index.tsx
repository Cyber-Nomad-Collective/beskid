import type { SidebarNavItem } from "@cyber-nomad-collective/beskid-shell-core";
import {
	AppShell,
	TopbarLeftSlot,
	TopbarRightSlot,
} from "@cyber-nomad-collective/beskid-shell-core";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import { createFileRoute } from "@tanstack/react-router";
import { Bug, MapIcon } from "lucide-react";

const sampleItems: SidebarNavItem[] = [
	{ id: "home", label: "Home", href: "/", icon: MapIcon, active: true },
	{ id: "bugs", label: "Bugs", href: "/bugs", icon: Bug },
];

function IndexPage() {
	const user = Route.useRouteContext({ select: (c) => c.user });

	return (
		<AppShell
			sidebarItems={sampleItems}
			sidebarEnabled
			user={user}
			brandLabel="Beskid"
			brandSubtitle="Shell Template"
			leftSlot={
				<TopbarLeftSlot>
					<p className="island-kicker hidden shrink-0 sm:block">Beskid</p>
				</TopbarLeftSlot>
			}
			rightSlot={
				<TopbarRightSlot>
					<BeskidHub />
				</TopbarRightSlot>
			}
		>
			<main className="p-8">
				<h1 className="text-2xl font-semibold">Beskid Shell Template</h1>
				<p className="mt-2 text-muted-foreground">
					Reusable TanStack Start shell. Signed in as{" "}
					{user ? user.username : "anonymous"}.
				</p>
			</main>
		</AppShell>
	);
}

export const Route = createFileRoute("/")({
	component: IndexPage,
});

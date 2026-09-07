import {
	AppShell,
	type SidebarNavItem,
	TopbarLeftSlot,
	TopbarRightSlot,
} from "@cyber-nomad-collective/beskid-shell-core";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Edit, FileText, ShieldCheck } from "lucide-react";

const editNavItems: SidebarNavItem[] = [
	{
		id: "specification",
		label: "Specification",
		href: "/platform-spec",
		icon: FileText,
		tooltip: "Specification",
	},
	{
		id: "drafts",
		label: "Drafts",
		href: "/edit",
		icon: Edit,
		tooltip: "Drafts",
	},
	{
		id: "moderation",
		label: "Moderation",
		href: "/moderation",
		icon: ShieldCheck,
		tooltip: "Moderation",
	},
];

export const Route = createFileRoute("/_edit")({
	beforeLoad: async ({ context }) => {
		if (!context.user) {
			throw redirect({ href: "/api/auth/login" });
		}
		return { user: context.user };
	},
	component: EditShell,
});

function EditShell() {
	const { user } = Route.useRouteContext();

	return (
		<AppShell
			sidebarItems={editNavItems}
			sidebarEnabled
			user={user}
			brandLabel="Beskid"
			brandSubtitle="Platform Spec"
			homeHref="/"
			signOutHref="/api/auth/logout"
			leftSlot={
				<TopbarLeftSlot>
					<span className="text-sm font-semibold tracking-tight">Platform Spec</span>
				</TopbarLeftSlot>
			}
			rightSlot={
				<TopbarRightSlot>
					<BeskidHub />
				</TopbarRightSlot>
			}
		>
			<main className="p-6">
				<Outlet />
			</main>
		</AppShell>
	);
}

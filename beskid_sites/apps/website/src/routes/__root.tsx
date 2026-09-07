import {
	AppShell,
	ThemeProvider,
	TopbarLeftSlot,
	TopbarRightSlot,
} from "@cyber-nomad-collective/beskid-shell-core";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { PageTransition } from "#/components/page-transition";
import type { WebsiteRouterContext } from "#/router";
import { getShellUser } from "#/server/shell-user";
import appCss from "#/styles.css?url";

export const Route = createRootRouteWithContext<WebsiteRouterContext>()({
	beforeLoad: async () => {
		const user = await getShellUser();
		return { user };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Beskid — a language and platform for everyday software" },
			{
				name: "description",
				content:
					"A statically typed, AOT-first language for services, CLIs, and teams that outgrew .NET's abstraction stack.",
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const user = Route.useRouteContext({ select: (c) => c.user });

	return (
		<ThemeProvider>
			<AppShell
				sidebarEnabled={false}
				user={user}
				brandLabel="Beskid"
				brandSubtitle="Language & platform"
				homeHref="/"
				leftSlot={
					<TopbarLeftSlot>
						<Link
							to="/"
							className="island-kicker"
							style={{ textDecoration: "none", fontWeight: 700 }}
						>
							Beskid
						</Link>
					</TopbarLeftSlot>
				}
				rightSlot={
					<TopbarRightSlot>
						<BeskidHub />
					</TopbarRightSlot>
				}
			>
				<PageTransition>
					<Outlet />
				</PageTransition>
			</AppShell>
		</ThemeProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

import { ThemeProvider } from "@cyber-nomad-collective/beskid-shell-core";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ShellRouterContext } from "#/router";
import { getShellUser } from "#/server/shell-user";
import appCss from "#/styles.css?url";

export const Route = createRootRouteWithContext<ShellRouterContext>()({
	beforeLoad: async () => {
		const user = await getShellUser();
		return { user };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Beskid Shell" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	return (
		<ThemeProvider>
			<Outlet />
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

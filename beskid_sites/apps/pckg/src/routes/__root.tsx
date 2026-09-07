import { ThemeProvider } from "@cyber-nomad-collective/beskid-shell-core";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { PckgRouterContext } from "#/router";
import { getShellUser } from "#/server/shell-user";
import appCss from "#/styles.css?url";

export const Route = createRootRouteWithContext<PckgRouterContext>()({
	beforeLoad: async () => {
		const user = await getShellUser();
		return { user };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Beskid pckg" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const { queryClient } = Route.useRouteContext();

	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<Outlet />
			</QueryClientProvider>
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

import { ThemeProvider } from "@cyber-nomad-collective/beskid-shell-core";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ComponentProps } from "react";
import { RoadmapNotFound } from "#/components/roadmap-not-found";
import { RoadmapRouteError } from "#/components/roadmap-route-error";
import { TooltipProvider } from "#/components/ui/tooltip";
import { observabilityMiddleware } from "#/observability-middleware";
import type { TrackerRouterContext } from "#/router";
import { getShellUser } from "#/server/shell-user";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

function RootNotFound() {
	return <RoadmapNotFound layout="standalone" />;
}

function RootRouteError(props: ComponentProps<typeof RoadmapRouteError>) {
	return <RoadmapRouteError {...props} layout="standalone" />;
}

export const Route = createRootRouteWithContext<TrackerRouterContext>()({
	server: {
		middleware: [observabilityMiddleware],
	},
	beforeLoad: async () => {
		const user = await getShellUser();
		return { user };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Beskid Tracker" },
		],
		links: [
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "stylesheet", href: appCss },
		],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
	notFoundComponent: RootNotFound,
	errorComponent: RootRouteError,
});

function RootComponent() {
	const { queryClient } = Route.useRouteContext();

	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<Outlet />
				</TooltipProvider>
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
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

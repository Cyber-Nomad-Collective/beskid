import { ThemeProvider } from "@cyber-nomad-collective/beskid-shell-core";
import { TooltipProvider } from "@cyber-nomad-collective/beskid-ui-react";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";

import { RootSpecRouteError } from "#/components/spec-route-error";
import type { SpecRouterContext } from "#/router";
import { observabilityMiddleware } from "#/server/observability-middleware";
import { getShellUser } from "#/server/shell-user";
import appCss from "#/styles.css?url";

export const Route = createRootRouteWithContext<SpecRouterContext>()({
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
			{ title: "Beskid Platform Spec" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
	errorComponent: RootSpecRouteError,
});

function RootComponent() {
	return (
		<ThemeProvider>
			<TooltipProvider>
				<Outlet />
			</TooltipProvider>
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
				<script type="module" src="/beskid-doc-embed.js" />
				<Scripts />
			</body>
		</html>
	);
}

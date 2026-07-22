import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from "@tanstack/react-router";

import { RootSpecRouteError } from "#/components/spec-route-error";
import { ThemeProvider } from "#/components/theme-provider";
import { observabilityMiddleware } from "#/server/observability-middleware";
import appCss from "#/styles.css?url";

export const Route = createRootRoute({
	server: {
		middleware: [observabilityMiddleware],
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
				<script type="module" src="/beskid-doc-embed.js" />
				<Scripts />
			</body>
		</html>
	);
}

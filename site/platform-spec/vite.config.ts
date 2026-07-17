import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function packageSrc(specifier: string): string {
	const segments = specifier.split("/");
	const candidate = path.join(rootDir, "node_modules", ...segments);
	if (fs.existsSync(path.join(candidate, "package.json"))) {
		return path.join(candidate, "src");
	}
	const resolved = require.resolve(specifier);
	const resolvedDir = path.dirname(resolved);
	if (path.basename(resolvedDir) === "src") {
		return resolvedDir;
	}
	return path.join(resolvedDir, "src");
}

const beskidUiSrc = packageSrc("@beskid/beskid-ui");

const packageAliases = [
	{
		find: "@beskid/material-theme",
		replacement: path.join(beskidUiSrc, "styles/theme.material.css"),
	},
	{
		find: "@beskid/beskid-ui/styles/hub.css",
		replacement: path.join(beskidUiSrc, "styles/hub.css"),
	},
	{
		find: "@beskid/beskid-ui",
		replacement: path.join(beskidUiSrc, "index.ts"),
	},
];

export default defineConfig({
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart({
			importProtection: {
				enabled: true,
			},
		}),
		nitro({ preset: "bun" }),
		viteReact(),
	],
	resolve: {
		tsconfigPaths: true,
		dedupe: [
			"class-variance-authority",
			"clsx",
			"tailwind-merge",
			"radix-ui",
			"lucide-react",
			"next-themes",
			"sonner",
			"vaul",
			"cmdk",
			"react-day-picker",
			"react-resizable-panels",
			"embla-carousel-react",
			"recharts",
			"input-otp",
			"@base-ui/react",
			"jose",
		],
		alias: packageAliases,
	},
	ssr: {
		noExternal: [
			"@beskid/beskid-ui",
			"@beskid/ui-react",
			"@beskid/auth-client",
			"@beskid/server-observability",
			"pino",
			"prom-client",
		],
	},
});

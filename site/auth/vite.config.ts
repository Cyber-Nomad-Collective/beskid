import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function packageSrc(specifier: string): string {
	const segments = specifier.split("/");
	const candidate = path.join(rootDir, "node_modules", ...segments);
	const root = fs.existsSync(path.join(candidate, "package.json"))
		? candidate
		: path.dirname(require.resolve(specifier));
	return path.join(root, "src");
}

const beskidUiSrc = packageSrc("@beskid/beskid-ui");
const uiReactSrc = packageSrc("@beskid/ui-react");

const packageAliases = [
	{
		find: "@beskid/ui-react/styles/shadcn-entry.css",
		replacement: path.join(uiReactSrc, "styles/shadcn-entry.css"),
	},
	{
		find: "@beskid/ui-react",
		replacement: path.join(uiReactSrc, "index.ts"),
	},
	{
		find: "@beskid/material-theme",
		replacement: path.join(beskidUiSrc, "styles/theme.material.css"),
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
		noExternal: ["@beskid/ui-react", "@beskid/auth-client"],
	},
});

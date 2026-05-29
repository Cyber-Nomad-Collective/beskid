import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const beskidUiRoot = path.resolve(
	rootDir,
	"../../beskid_web_common/packages/beskid-ui",
);
const uiReactRoot = path.resolve(
	rootDir,
	"../../beskid_web_common/packages/beskid-ui-react",
);
const authClientRoot = path.resolve(
	rootDir,
	"../../beskid_web_common/packages/beskid-auth-client",
);

const workspaceAliases = [
	{
		find: "@beskid/ui-react/styles/shadcn-entry.css",
		replacement: path.join(uiReactRoot, "src/styles/shadcn-entry.css"),
	},
	{
		find: "@beskid/ui-react",
		replacement: path.join(uiReactRoot, "src/index.ts"),
	},
	{
		find: "@beskid/auth-client",
		replacement: path.join(authClientRoot, "src/index.ts"),
	},
	{
		find: "@beskid/material-theme",
		replacement: path.join(beskidUiRoot, "src/styles/theme.material.css"),
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
		// Workaround: when Vite aliases resolve @beskid/* packages from workspace
		// source directories, Rolldown resolves their transitive deps starting from
		// the workspace location instead of the project root node_modules.
		// dedupe forces resolution of these packages from the project root.
		dedupe: [
			// @beskid/ui-react transitive deps
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
			// @beskid/auth-client transitive deps
			"jose",
		],
		alias: workspaceAliases,
	},
	ssr: {
		resolve: {
			alias: workspaceAliases,
		},
		noExternal: ["@beskid/ui-react", "@beskid/auth-client"],
	},
});

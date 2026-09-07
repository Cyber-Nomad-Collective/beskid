import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart({
			importProtection: {
				enabled: true,
			},
		}),
		nitro({
			preset: "node-server",
		}),
		viteReact(),
		tsconfigPaths(),
	],
	resolve: {
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
			"react",
			"react-dom",
		],
	},
	ssr: {
		noExternal: [
			"@cyber-nomad-collective/beskid-ui-react",
			"@cyber-nomad-collective/beskid-shell-core",
		],
	},
});

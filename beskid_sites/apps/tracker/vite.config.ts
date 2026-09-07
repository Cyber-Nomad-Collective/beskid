import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const uiReactSrc = path.resolve(rootDir, "../../packages/beskid-ui-react/src");

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
		alias: {
			// Preserve the tracker's `#/components/ui/*` / `#/lib/utils` /
			// `#/hooks/use-mobile` aliases — repointed at the new shared lib
			// source (the old tracker pointed these at @beskid/ui-react).
			"#/components/ui": path.join(uiReactSrc, "components/ui"),
			"#/lib/utils.ts": path.join(uiReactSrc, "lib/utils.ts"),
			"#/lib/utils": path.join(uiReactSrc, "lib/utils.ts"),
			"#/hooks/use-mobile.ts": path.join(uiReactSrc, "hooks/use-mobile.ts"),
			"#/hooks/use-mobile": path.join(uiReactSrc, "hooks/use-mobile.ts"),
		},
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
			"react",
			"react-dom",
		],
	},
	ssr: {
		noExternal: [
			"@cyber-nomad-collective/beskid-ui-react",
			"@cyber-nomad-collective/beskid-shell-core",
		],
		external: ["node:sqlite", "node:fs", "node:path"],
	},
});

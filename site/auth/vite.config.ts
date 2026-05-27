import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
		alias: {
			"@beskid/ui-react": path.resolve(
				rootDir,
				"../../beskid_web_common/packages/beskid-ui-react/src/index.ts",
			),
			"@beskid/auth-client": path.resolve(
				rootDir,
				"../../beskid_web_common/packages/beskid-auth-client/src/index.ts",
			),
		},
	},
	ssr: {
		resolve: {
			alias: {
				"@beskid/ui-react": path.resolve(
					rootDir,
					"../../beskid_web_common/packages/beskid-ui-react/src/index.ts",
				),
				"@beskid/auth-client": path.resolve(
					rootDir,
					"../../beskid_web_common/packages/beskid-auth-client/src/index.ts",
				),
			},
		},
		noExternal: ["@beskid/ui-react", "@beskid/auth-client"],
	},
	plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
});

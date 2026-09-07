import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const uiReactSrc = path.resolve(rootDir, "../../packages/beskid-ui-react/src");

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"#": path.resolve(rootDir, "src"),
			"#/*": path.resolve(rootDir, "src"),
			"#/components/ui": path.join(uiReactSrc, "components/ui"),
			"#/lib/utils.ts": path.join(uiReactSrc, "lib/utils.ts"),
			"#/lib/utils": path.join(uiReactSrc, "lib/utils.ts"),
			"#/hooks/use-mobile.ts": path.join(uiReactSrc, "hooks/use-mobile.ts"),
			"#/hooks/use-mobile": path.join(uiReactSrc, "hooks/use-mobile.ts"),
		},
		dedupe: ["react", "react-dom"],
	},
	test: {
		environment: "node",
		environmentMatchGlobs: [
			["src/components/**/*.test.tsx", "jsdom"],
			["src/server/**/*.test.ts", "node"],
		],
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
	},
});

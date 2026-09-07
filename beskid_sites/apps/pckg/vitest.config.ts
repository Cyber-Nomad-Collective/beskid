import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"#": path.resolve(rootDir, "src"),
			"#/*": path.resolve(rootDir, "src"),
		},
		dedupe: ["react", "react-dom"],
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		setupFiles: ["./src/test-setup.tsx"],
		passWithNoTests: true,
	},
});

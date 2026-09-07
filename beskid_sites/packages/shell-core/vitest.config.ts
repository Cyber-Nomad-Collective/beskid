import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	test: {
		environment: "jsdom",
		// Server tests (jose JWT, OIDC, session) need the node environment —
		// jose's webapi build rejects jsdom-realm Uint8Array instances. The
		// server tests are `.test.ts` (no DOM); client component tests are
		// `.test.tsx` and stay in jsdom.
		environmentMatchGlobs: [
			["src/__tests__/*.test.ts", "node"],
			["src/server/**/*.test.ts", "node"],
		],
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		setupFiles: ["./src/test-setup.tsx"],
		css: false,
	},
});

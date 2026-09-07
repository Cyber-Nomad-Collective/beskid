import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const beskidUiReactSrc = path.resolve(
	__dirname,
	"../../packages/beskid-ui-react/src",
);

export default defineConfig({
	plugins: [react()],
	define: {
		__REQUIRED_NODE_VERSION__: JSON.stringify("22.12.0"),
		"import.meta.env.SHELL_AUTH_MODE": JSON.stringify(
			process.env.SHELL_AUTH_MODE || "",
		),
	},
	resolve: {
		// Array form so exact specifiers win over prefix matches.
		alias: [
			{ find: "@", replacement: path.resolve(__dirname, "./src") },
			{
				find: "#beskid-hub-entry",
				replacement: path.resolve(__dirname, "./src/shell/hub-entry.ts"),
			},
			{
				find: "#beskid-hub-css",
				replacement: path.join(beskidUiReactSrc, "styles/hub.css"),
			},
			{
				find: "#beskid-theme-css",
				replacement: path.join(beskidUiReactSrc, "styles/tokens.css"),
			},
			{
				find: "@beskid/material-theme",
				replacement: path.join(beskidUiReactSrc, "styles/tokens.css"),
			},
			{
				find: "mermaid",
				replacement: path.resolve(
					__dirname,
					"node_modules/mermaid/dist/mermaid.esm.min.mjs",
				),
			},
		],
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./test/setup.ts"],
		include: ["test/**/*.test.{ts,tsx}"],
		exclude: ["e2e/**", "node_modules/**", "dist/**"],
		testTimeout: 15000,
		coverage: {
			provider: "v8",
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/shell/**"],
		},
	},
});

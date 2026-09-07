import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const beskidUiReactSrc = path.resolve(
	__dirname,
	"../../packages/beskid-ui-react/src",
);

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: {
		__REQUIRED_NODE_VERSION__: JSON.stringify("22.12.0"),
		"import.meta.env.VITE_NEXUS_DEFAULT_REPO": JSON.stringify(
			process.env.VITE_NEXUS_DEFAULT_REPO || "",
		),
		"import.meta.env.VITE_NEXUS_HOSTED": JSON.stringify(
			process.env.VITE_NEXUS_HOSTED || "",
		),
		"import.meta.env.SHELL_AUTH_MODE": JSON.stringify(
			process.env.SHELL_AUTH_MODE || "",
		),
	},
	resolve: {
		dedupe: [
			"react",
			"react-dom",
			"@cyber-nomad-collective/beskid-ui-react",
			"@cyber-nomad-collective/beskid-shell-core",
		],
		alias: {
			"@": path.resolve(__dirname, "./src"),
			// `gitnexus-shared` resolves natively via the workspace package's
			// `exports` (which point at source `.ts` files), so no alias is
			// needed here — the `./test-helpers` subpath is declared too.
			// Beskid hub / theme CSS + entry aliases (re-pointed at the canonical
			// @cyber-nomad-collective/beskid-ui-react lib; the old @beskid/beskid-ui
			// package is gone).
			"#beskid-hub-entry": path.resolve(__dirname, "./src/shell/hub-entry.ts"),
			"#beskid-hub-css": path.join(beskidUiReactSrc, "styles/hub.css"),
			"#beskid-theme-css": path.join(beskidUiReactSrc, "styles/tokens.css"),
			"@beskid/material-theme": path.join(beskidUiReactSrc, "styles/tokens.css"),
			// Mermaid ESM bundle (matches the original Vite config).
			mermaid: path.resolve(
				__dirname,
				"node_modules/mermaid/dist/mermaid.esm.min.mjs",
			),
		},
	},
	server: {
		fs: { allow: [".."] },
		proxy: {
			"/api": {
				target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8452",
				changeOrigin: true,
			},
		},
	},
});

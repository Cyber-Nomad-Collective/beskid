import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"#": resolve(__dirname, "src"),
			"@beskid/material-theme": resolve(
				__dirname,
				"node_modules/@beskid/beskid-ui/src/styles/theme.material.css",
			),
		},
	},
	server: {
		host: "0.0.0.0",
		port: 4173,
	},
	build: {
		target: "esnext",
	},
});

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"#": resolve(__dirname, "src"),
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

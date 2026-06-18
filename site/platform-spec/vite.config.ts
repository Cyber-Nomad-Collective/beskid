import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function packageSrc(specifier: string): string {
	const segments = specifier.split("/");
	const candidate = path.join(rootDir, "node_modules", ...segments);
	if (fs.existsSync(path.join(candidate, "package.json"))) {
		return path.join(candidate, "src");
	}
	const resolved = require.resolve(specifier);
	const resolvedDir = path.dirname(resolved);
	if (path.basename(resolvedDir) === "src") {
		return resolvedDir;
	}
	return path.join(resolvedDir, "src");
}

// Resolve a subpath of a @beskid package to its source file, preferring the
// published node_modules copy and falling back to the beskid_web_common
// workspace source when the published version doesn't yet ship that subpath
// (publish-gap bridge — remove once the subpath ships on the registry).
function packageSubpath(specifier: string, subpath: string): string {
	const pkgSrc = packageSrc(specifier);
	const published = path.join(pkgSrc, subpath);
	if (fs.existsSync(published)) {
		return published;
	}
	// Workspace fallback: beskid_web_common is a sibling submodule, checked
	// out by setup-beskid-web / init-submodules.sh in CI and present locally.
	// rootDir is site/platform-spec, so ../.. reaches the superrepo root;
	// the workspace package dir is beskid-<name> (e.g. @beskid/ui-react ->
	// packages/beskid-ui-react).
	const segments = specifier.split("/");
	const pkgName = `beskid-${segments[segments.length - 1]}`;
	const workspaceSrc = path.join(
		rootDir,
		"..",
		"..",
		"beskid_web_common",
		"packages",
		pkgName,
		"src",
		subpath,
	);
	if (fs.existsSync(workspaceSrc)) {
		return workspaceSrc;
	}
	// Last resort: return the published path so the error message points at
	// the expected location rather than a confusing fallback.
	return published;
}

const beskidUiSrc = packageSrc("@beskid/beskid-ui");
const uiReactSrc = packageSrc("@beskid/ui-react");

const packageAliases = [
	{
		find: "@beskid/ui-react/styles/shadcn-entry.css",
		replacement: path.join(uiReactSrc, "styles/shadcn-entry.css"),
	},
	{
		find: "@beskid/ui-react/platform-spec",
		replacement: packageSubpath("@beskid/ui-react", "platform-spec/index.ts"),
	},
	{
		find: "@beskid/ui-react/architecture-graph",
		replacement: packageSubpath("@beskid/ui-react", "architecture-graph/index.ts"),
	},
	{
		find: "@beskid/ui-react",
		replacement: path.join(uiReactSrc, "index.ts"),
	},
	{
		find: "@beskid/material-theme",
		replacement: path.join(beskidUiSrc, "styles/theme.material.css"),
	},
	{
		find: "@beskid/beskid-ui/styles/hub.css",
		replacement: path.join(beskidUiSrc, "styles/hub.css"),
	},
	{
		find: "@beskid/beskid-ui",
		replacement: path.join(beskidUiSrc, "index.ts"),
	},
];

export default defineConfig({
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart({
			importProtection: {
				enabled: true,
			},
		}),
		nitro({ preset: "bun" }),
		viteReact(),
	],
	resolve: {
		tsconfigPaths: true,
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
		],
		alias: packageAliases,
	},
	ssr: {
		noExternal: [
			"@beskid/ui-react",
			"@beskid/beskid-ui",
			"@beskid/auth-client",
			"@beskid/server-observability",
			"pino",
			"prom-client",
		],
	},
});

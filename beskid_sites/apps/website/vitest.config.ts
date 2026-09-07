import path from "node:path";
import { fileURLToPath } from "node:url";

import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// The unified ecosystem ships stricter `this`-typed plugin generics than
// `@mdx-js/rollup`'s `PluggableList` slot accepts cleanly; cast through
// `unknown` once.
const remarkPlugins = [
	remarkGfm,
	remarkFrontmatter,
	remarkMdxFrontmatter,
] as unknown as import("unified").PluggableList;

export default defineConfig({
	plugins: [
		// Compile `.mdx`/`.md` content files so `import.meta.glob` in the
		// content manifest resolves to React components under vitest too.
		mdx({
			providerImportSource: "@mdx-js/react",
			remarkPlugins,
			rehypePlugins: [rehypeSlug],
		}),
		react({ include: /\.(ts|tsx|js|jsx|mdx|md)$/ }),
	],
	resolve: {
		alias: {
			"#": path.resolve(rootDir, "src"),
			"#/*": path.resolve(rootDir, "src"),
		},
		dedupe: ["react", "react-dom", "@mdx-js/react"],
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		setupFiles: ["./src/test-setup.tsx"],
	},
});

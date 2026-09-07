import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// The unified ecosystem ships stricter `this`-typed plugin generics than
// `@mdx-js/rollup`'s `PluggableList` slot accepts cleanly; cast through
// `unknown` once. `unified` is a transitive dep — the type-only import is
// resolved from the pnpm virtual store at typecheck time.
const remarkPlugins = [
	remarkGfm,
	remarkFrontmatter,
	remarkMdxFrontmatter,
] as unknown as import("unified").PluggableList;

export default defineConfig({
	plugins: [
		devtools(),
		// Compile `.mdx` and `.md` content files into React components.
		// `remark-frontmatter` + `remark-mdx-frontmatter` expose YAML
		// frontmatter as a named `frontmatter` export on each module so the
		// content manifest can list chapters/posts without a separate parse.
		mdx({
			providerImportSource: "@mdx-js/react",
			remarkPlugins,
			rehypePlugins: [rehypeSlug],
		}),
		tailwindcss(),
		tanstackStart({
			importProtection: {
				enabled: true,
			},
		}),
		nitro({
			preset: "node-server",
		}),
		viteReact({ include: /\.(ts|tsx|js|jsx|mdx|md)$/ }),
		tsconfigPaths(),
	],
	resolve: {
		dedupe: [
			"react",
			"react-dom",
			"@mdx-js/react",
			"lucide-react",
			"next-themes",
		],
	},
	ssr: {
		noExternal: [
			"@cyber-nomad-collective/beskid-ui-react",
			"@cyber-nomad-collective/beskid-shell-core",
		],
	},
});

/// <reference types="astro/client" />

declare module "@beskid/beskid-ui/shell-css" {
	const docsShellCustomCss: string[];

	export { docsShellCustomCss };
}

declare module "trudoc/scripts/remark-arch-code-fence.mjs" {
	export function createRemarkArchCodeFence(): () => (tree: unknown) => void;
}

declare module "trudoc/scripts/remark-inline-repo-paths.mjs" {
	import type { RemarkPlugin } from "@astrojs/markdown-remark";
	export function remarkInlineRepoPaths(opts: { repo: string }): RemarkPlugin;
}

declare module "trudoc/scripts/remark-repo-link-fence.mjs" {
	import type { RemarkPlugin } from "@astrojs/markdown-remark";
	export function remarkRepoLinkFence(opts: { repo: string }): RemarkPlugin;
}

declare module "trudoc/grammars/load-beskid-grammar.mjs" {
	export function loadBeskidGrammar(): Record<string, unknown>[];
}

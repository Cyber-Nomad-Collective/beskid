/**
 * Turn ```mermaid fences into the `<pre class="mermaid">` element astro-mermaid's
 * client script renders.
 *
 * astro-mermaid 2.x registers its own transform on Astro's `markdown.processor`,
 * but @astrojs/mdx 5 only reads the legacy `markdown.remarkPlugins` arrays, so
 * `.mdx` pages never see it and their diagrams render as plain code blocks. This
 * plugin is passed to the MDX integration directly. It emits an MDX JSX node, not
 * raw HTML, because MDX drops `html` nodes, and it keeps the diagram source as a
 * text child so no brace or angle-bracket escaping is needed.
 */
export function remarkMermaidMdx() {
	return (tree) => {
		const walk = (node) => {
			if (!Array.isArray(node.children)) return;
			node.children = node.children.map((child) => {
				if (child.type === 'code' && child.lang === 'mermaid') {
					return {
						type: 'mdxJsxFlowElement',
						name: 'pre',
						attributes: [{ type: 'mdxJsxAttribute', name: 'class', value: 'mermaid' }],
						children: [{ type: 'text', value: child.value }],
					};
				}
				walk(child);
				return child;
			});
		};
		walk(tree);
	};
}

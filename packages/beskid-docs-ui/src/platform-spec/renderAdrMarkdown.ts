import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import { remarkInlineRepoPaths } from 'trudoc/scripts/remark-inline-repo-paths.mjs';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/** Undo shell-escaped and MDX-wrapped backticks so GFM tables and inline code parse correctly. */
export function normalizeAdrSectionMarkdown(markdown: string): string {
	return markdown
		.replace(/\\`/g, '`')
		.replace(/``\s*(`[^`\n]+`)\s*``/g, '$1')
		.replace(/``([^`\n]+?)``/g, '`$1`');
}

let processor: ReturnType<typeof unified> | null = null;

function getProcessor() {
	if (!processor) {
		processor = unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkInlineRepoPaths())
			.use(remarkRehype)
			.use(rehypeStringify);
	}
	return processor;
}

/** Render ADR section markdown to HTML for expandable reader panels (GFM tables, lists, code). */
export async function renderAdrSectionMarkdown(markdown: string): Promise<string> {
	const normalized = normalizeAdrSectionMarkdown(markdown.trim());
	if (!normalized) return '';
	const result = await getProcessor().process(normalized);
	return String(result);
}

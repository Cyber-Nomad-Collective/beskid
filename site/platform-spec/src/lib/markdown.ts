import { marked } from "marked";

marked.setOptions({
	gfm: true,
	breaks: false,
});

export function renderMarkdownToHtml(markdown: string): string {
	return marked.parse(markdown, { async: false }) as string;
}

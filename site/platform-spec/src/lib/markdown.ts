import { marked } from "marked";
import { transformBeskidDirectives } from "./markdown-directives";

marked.setOptions({
	gfm: true,
	breaks: false,
});

export function renderMarkdownToHtml(markdown: string): string {
	return marked.parse(transformBeskidDirectives(markdown), {
		async: false,
	}) as string;
}

import { common, createLowlight } from "lowlight";

/**
 * Shared lowlight instance for the platform-spec reader.
 *
 * A single lowlight engine is reused by every code-rendering surface
 * (SourceCodeEmbed, GitHubCodeSnippet) so grammar registration and
 * highlighting stay in one place.
 */
const lowlight = createLowlight(common);

/** Minimal hast node shape used by the walker. */
type HastNode =
	| { type: "text"; value: string }
	| {
			type: "element";
			properties?: { className?: string[] };
			children: HastNode[];
	  };

/** Result of highlighting code into an HTML string suitable for `dangerouslySetInnerHTML`. */
export function highlightCodeToHtml(lang: string, code: string): string {
	const tree = (() => {
		try {
			return lowlight.highlight(lang, code);
		} catch {
			return lowlight.highlight("text", code);
		}
	})();

	const builder: string[] = [];
	function escapeHtml(s: string): string {
		return s
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}
	function walk(node: HastNode): void {
		if (node.type === "text") {
			builder.push(escapeHtml(node.value));
		} else if (node.type === "element") {
			const classes = (node.properties?.className ?? []).join(" ");
			builder.push(`<span class="${classes}">`);
			for (const child of node.children) walk(child);
			builder.push("</span>");
		}
	}
	for (const child of tree.children as HastNode[]) walk(child);
	return builder.join("");
}

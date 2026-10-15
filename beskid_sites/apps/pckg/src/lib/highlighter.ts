import beskidGrammar from "@beskid/beskid-grammar";
import type {
	HighlighterCore,
	LanguageRegistration,
	ThemedToken,
} from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Language } from "#/lib/languages";

/**
 * Shiki with the canonical Beskid TextMate grammar from `@beskid/trudoc`, the
 * same grammar the website's code blocks use. BSOL manifests are HCL-shaped
 * (`block { key = value }`), so they use Shiki's HCL grammar.
 */
const SHIKI_LANGUAGE: Record<Exclude<Language, "text">, string> = {
	beskid: "beskid",
	bsol: "hcl",
	json: "json",
	markdown: "markdown",
};

export const THEMES = { light: "github-light", dark: "github-dark" } as const;

let highlighter: Promise<HighlighterCore> | undefined;

function loadHighlighter(): Promise<HighlighterCore> {
	highlighter ??= createHighlighterCore({
		engine: createJavaScriptRegexEngine(),
		themes: [
			import("shiki/themes/github-light.mjs"),
			import("shiki/themes/github-dark.mjs"),
		],
		langs: [
			beskidGrammar as unknown as LanguageRegistration,
			import("shiki/langs/hcl.mjs"),
			import("shiki/langs/json.mjs"),
			import("shiki/langs/markdown.mjs"),
		],
	});
	return highlighter;
}

/** Token lines with light colors in `color` and dark colors in `htmlStyle`. */
export async function highlightLines(
	source: string,
	language: Language,
): Promise<ThemedToken[][] | undefined> {
	if (language === "text") {
		return undefined;
	}
	const shiki = await loadHighlighter();
	return shiki.codeToTokens(source, {
		lang: SHIKI_LANGUAGE[language],
		themes: THEMES,
		defaultColor: "light",
	}).tokens;
}

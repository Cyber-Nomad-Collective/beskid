/**
 * Build-time Shiki highlighting for the landing code surfaces.
 *
 * Single implementation shared by `LandingCodeWindow.astro` (hero terminal) and
 * `LandingCodePane.astro` (tile-dialog code blocks). Replaces the former naive
 * regex keyword highlighters with the registered Beskid grammar plus Shiki's
 * built-in csharp/asm grammars.
 *
 * Dual themes (`github-light` / `one-dark-pro`) are loaded once; `one-dark-pro`
 * matches the existing `--landing-code-kw` (#c678dd) / `--landing-code-type`
 * (#e5c07b) dark palette. Light/dark switching is driven by the per-token
 * `--shiki-dark` inline variables + the CSS overrides in `landing.css`.
 *
 * Note: Shiki ships no CIL/IL grammar, so `il` is mapped to the nearest built-in
 * (`asm`), which highlights CIL labels (`IL_0000:`) and mnemonics (`call`).
 */
import { createHighlighter } from 'shiki';
import csharpGrammar from 'shiki/langs/csharp.mjs';
import asmGrammar from 'shiki/langs/asm.mjs';
import oneDarkPro from 'shiki/themes/one-dark-pro.mjs';
import githubLight from 'shiki/themes/github-light.mjs';
// Import the grammar JSON directly so Vite bundles it into the prerender chunk
// (a runtime `readFileSync` relative to `import.meta.url` would resolve to the
// chunk dir and fail with ENOENT during SSG).
import beskidGrammar from 'trudoc/grammars/beskid.tmLanguage.json';

/** Languages accepted by the landing code surfaces. */
export const LANDING_CODE_LANGS = /** @type {const} */ (['beskid', 'csharp', 'il', 'asm']);

/** Shiki language id per landing lang (`il` has no Shiki grammar → `asm`). */
const SHIKI_LANG = {
	beskid: 'beskid',
	csharp: 'csharp',
	il: 'asm',
	asm: 'asm',
};

const DARK_THEME = 'one-dark-pro';
const LIGHT_THEME = 'github-light';

let highlighterPromise = null;

/** Lazily build (and cache) the singleton Shiki highlighter. */
function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			langs: [beskidGrammar, csharpGrammar, asmGrammar],
			themes: [oneDarkPro, githubLight],
		});
	}
	return highlighterPromise;
}

/**
 * Highlight `code` for `lang` and return only the inner `<code>` HTML (token
 * spans wrapped in `<span class="line">`), so callers can embed it inside their
 * own `<pre>` without Shiki's `<pre>` background/padding fighting the terminal
 * styling.
 *
 * @param {string} code - Raw source.
 * @param {(typeof LANDING_CODE_LANGS)[number]} lang - Landing language id.
 * @returns {Promise<string>} Inner HTML for `<code>`.
 */
export async function highlightCode(code, lang) {
	const shikiLang = SHIKI_LANG[lang] ?? 'beskid';
	const highlighter = await getHighlighter();
	const html = highlighter.codeToHtml(code, {
		lang: shikiLang,
		themes: { light: LIGHT_THEME, dark: DARK_THEME },
	});
	const inner = html.match(/<code[^>]*>([\s\S]*)<\/code>\s*<\/pre>/);
	return inner ? inner[1] : '';
}

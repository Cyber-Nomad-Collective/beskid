/**
 * Dependency-free tokenizer for the file viewer.
 *
 * It covers the languages a `.bpk` artifact actually carries: Beskid sources
 * (`.bd`), BSOL project/workspace manifests (`.bproj`, `.bws`), JSON, Markdown
 * (shown as plain text when not rendered) and shell-ish text. Tokens map to
 * a small set of CSS classes so the viewer stays theme-aware through the
 * shared design tokens instead of a bundled highlighter theme.
 */

export type TokenKind =
	| "plain"
	| "keyword"
	| "type"
	| "string"
	| "number"
	| "comment"
	| "attribute"
	| "punctuation"
	| "property";

export interface Token {
	kind: TokenKind;
	text: string;
}

export type Language = "beskid" | "bsol" | "json" | "markdown" | "text";

/** Keywords from `beskid_analysis/src/beskid.pest`. */
const BESKID_KEYWORDS = new Set([
	"type",
	"enum",
	"contract",
	"attribute",
	"impl",
	"extend",
	"This",
	"where",
	"match",
	"event",
	"when",
	"if",
	"else",
	"while",
	"for",
	"in",
	"return",
	"break",
	"continue",
	"let",
	"const",
	"mut",
	"bulk",
	"mod",
	"use",
	"using",
	"pub",
	"test",
	"skip",
	"spawn",
	"clif",
	"async",
	"await",
	"code",
	"host",
	"registry",
	"scope",
	"startup",
	"init",
	"dispose",
	"with",
	"launch",
	"inject",
	"single",
	"transient",
	"global",
	"parent",
	"try",
	"catch",
	"fn",
	"true",
	"false",
	"self",
]);

const BSOL_KEYWORDS = new Set([
	"name",
	"type",
	"identity",
	"version",
	"source",
	"dependency",
	"registry",
	"path",
	"git",
	"project",
	"workspace",
	"target",
	"profile",
	"true",
	"false",
]);

export function languageForPath(path: string): Language {
	const name = path.split("/").pop() ?? path;
	const dot = name.lastIndexOf(".");
	const extension = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
	switch (extension) {
		case "bd":
		case "bsk":
			return "beskid";
		case "bproj":
		case "bws":
			return "bsol";
		case "json":
			return "json";
		case "md":
		case "markdown":
			return "markdown";
		default:
			return "text";
	}
}

export function isMarkdownPath(path: string): boolean {
	return languageForPath(path) === "markdown";
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*/;
const NUMBER = /^(0x[0-9A-Fa-f_]+|\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?)/;
const PUNCTUATION = /^[{}()[\];,.:<>=+\-*/%!&|^~?@#]+/;

function readString(source: string, quote: string): string {
	let index = 1;
	while (index < source.length) {
		const char = source[index];
		if (char === "\\") {
			index += 2;
			continue;
		}
		index += 1;
		if (char === quote) break;
		if (char === "\n") break;
	}
	return source.slice(0, index);
}

/** Tokenizes one line; multi-line constructs (block comments) carry state. */
function tokenizeLine(
	line: string,
	language: Language,
	state: { inBlockComment: boolean },
): Token[] {
	const tokens: Token[] = [];
	let rest = line;
	const keywords = language === "beskid" ? BESKID_KEYWORDS : BSOL_KEYWORDS;
	while (rest.length > 0) {
		if (state.inBlockComment) {
			const end = rest.indexOf("*/");
			if (end < 0) {
				tokens.push({ kind: "comment", text: rest });
				rest = "";
			} else {
				tokens.push({ kind: "comment", text: rest.slice(0, end + 2) });
				rest = rest.slice(end + 2);
				state.inBlockComment = false;
			}
			continue;
		}
		if (language !== "json" && (rest.startsWith("//") || rest.startsWith("#"))) {
			tokens.push({ kind: "comment", text: rest });
			rest = "";
			continue;
		}
		if (language !== "json" && rest.startsWith("/*")) {
			state.inBlockComment = true;
			tokens.push({ kind: "comment", text: "/*" });
			rest = rest.slice(2);
			continue;
		}
		const char = rest[0] as string;
		if (char === '"' || char === "'" || char === "`") {
			const text = readString(rest, char);
			const isJsonKey =
				language === "json" && /^\s*:/.test(rest.slice(text.length));
			tokens.push({ kind: isJsonKey ? "property" : "string", text });
			rest = rest.slice(text.length);
			continue;
		}
		if (char === "@" && language === "beskid") {
			const match = rest.match(/^@[A-Za-z_][A-Za-z0-9_]*/);
			if (match) {
				tokens.push({ kind: "attribute", text: match[0] });
				rest = rest.slice(match[0].length);
				continue;
			}
		}
		const number = rest.match(NUMBER);
		if (number) {
			tokens.push({ kind: "number", text: number[0] });
			rest = rest.slice(number[0].length);
			continue;
		}
		const identifier = rest.match(IDENTIFIER);
		if (identifier) {
			const word = identifier[0];
			let kind: TokenKind = "plain";
			if (language === "json") {
				kind =
					word === "true" || word === "false" || word === "null"
						? "keyword"
						: "plain";
			} else if (keywords.has(word)) {
				kind = "keyword";
			} else if (language === "beskid" && /^[A-Z]/.test(word)) {
				kind = "type";
			} else if (language === "bsol" && /^[A-Z]/.test(word)) {
				kind = "type";
			}
			tokens.push({ kind, text: word });
			rest = rest.slice(word.length);
			continue;
		}
		const punctuation = rest.match(PUNCTUATION);
		if (punctuation) {
			tokens.push({ kind: "punctuation", text: punctuation[0] });
			rest = rest.slice(punctuation[0].length);
			continue;
		}
		const whitespace = rest.match(/^\s+/);
		if (whitespace) {
			tokens.push({ kind: "plain", text: whitespace[0] });
			rest = rest.slice(whitespace[0].length);
			continue;
		}
		tokens.push({ kind: "plain", text: char });
		rest = rest.slice(1);
	}
	return mergePlain(tokens);
}

function mergePlain(tokens: Token[]): Token[] {
	const merged: Token[] = [];
	for (const token of tokens) {
		const previous = merged[merged.length - 1];
		if (
			previous &&
			previous.kind === token.kind &&
			(token.kind === "plain" || token.kind === "comment")
		) {
			previous.text += token.text;
		} else {
			merged.push({ ...token });
		}
	}
	return merged;
}

/** Tokenizes a whole document into lines of tokens (one array per line). */
export function tokenize(source: string, language: Language): Token[][] {
	if (language === "text" || language === "markdown") {
		return source
			.split("\n")
			.map((line) => (line.length > 0 ? [{ kind: "plain", text: line }] : []));
	}
	const state = { inBlockComment: false };
	return source.split("\n").map((line) => tokenizeLine(line, language, state));
}

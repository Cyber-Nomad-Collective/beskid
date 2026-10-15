/** Languages the file viewer highlights; everything else renders as text. */
export type Language = "beskid" | "bsol" | "json" | "markdown" | "text";

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

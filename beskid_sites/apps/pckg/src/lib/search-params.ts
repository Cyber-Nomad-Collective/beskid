/**
 * TanStack Router parses search values JSON-style, so `?item=53` or
 * `?version=1` arrive as numbers. Routes accept them as strings.
 */
export function searchString(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	return "";
}

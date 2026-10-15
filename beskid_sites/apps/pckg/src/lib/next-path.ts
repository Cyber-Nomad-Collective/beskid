/**
 * Same-origin path to return to after sign-in. Anything that is not a plain
 * absolute path (`//host`, `https://…`, `/\\host`) falls back to the dashboard,
 * so the parameter cannot become an open redirect.
 */
export function safeNextPath(next: string | null): string {
	if (
		!next ||
		!next.startsWith("/") ||
		next.startsWith("//") ||
		next.includes("\\")
	) {
		return "/dashboard";
	}
	return next;
}

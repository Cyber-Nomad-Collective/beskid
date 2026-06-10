/** Same-origin relative paths only (blocks open redirects). */
export function sanitizePostLoginPath(
	value: string | null | undefined,
): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
	if (trimmed.includes("\\")) return null;
	if (trimmed.length > 512) return null;
	return trimmed;
}

export const POST_LOGIN_REDIRECT_COOKIE = "beskid_platform_spec_post_login";

export function readPostLoginRedirect(request: Request): string | null {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === POST_LOGIN_REDIRECT_COOKIE) {
			return sanitizePostLoginPath(decodeURIComponent(rest.join("=")));
		}
	}
	return null;
}

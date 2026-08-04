export function isStaticAssetRequest(pathname: string): boolean {
	const leaf = pathname.slice(pathname.lastIndexOf("/") + 1);
	return pathname.startsWith("/assets/") || leaf.includes(".");
}

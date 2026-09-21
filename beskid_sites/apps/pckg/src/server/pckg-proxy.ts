import "@tanstack/react-start/server-only";

/** Copy an incoming request to the internal Rust registry without buffering its body. */
export async function buildPckgProxyRequest(
	request: Request,
	registryOrigin: string,
): Promise<Request> {
	const target = new URL(request.url);
	const origin = registryOrigin.replace(/\/$/, "");
	const headers = new Headers(request.headers);
	// Caddy/Authentik is the trusted boundary. Preserve its verified Remote-*
	// headers for Rust auth while never inventing identity in the web process.
	return new Request(`${origin}${target.pathname}${target.search}`, {
		method: request.method,
		headers,
		body:
			request.method === "GET" || request.method === "HEAD"
				? undefined
				: await request.arrayBuffer(),
		redirect: "manual",
	});
}

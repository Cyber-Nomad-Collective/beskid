import { PckgApiClient } from "./pckg-api";

export * from "./pckg-api";

/**
 * Client-side singleton.
 *
 * Defaults to `location.origin` (see `PckgApiClient` constructor). In
 * production the Nitro app and the pckg .NET API share a domain (the Nitro
 * app proxies `/api/*` to the .NET service), so `credentials: "include"`
 * cookies work same-origin. In dev a Vite/proxy or same-origin convention is
 * assumed.
 */
export const pckgApi = new PckgApiClient();

/**
 * Build a server-side {@link PckgApiClient} rooted at the configured pckg .NET
 * API origin. Used by TanStack Start server functions / loaders that need to
 * fetch registry data with the same contract as the client.
 *
 * Pass the Nitro request's `fetch` (or the global) so cookies can be forwarded
 * when needed.
 */
export function createServerPckgClient(
	baseUrl: string,
	options: { fetch?: typeof globalThis.fetch } = {},
): PckgApiClient {
	return new PckgApiClient({ baseUrl, ...options });
}

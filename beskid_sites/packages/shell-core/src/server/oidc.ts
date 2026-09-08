import "@tanstack/react-start/server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";

import type { ShellUser } from "../types";

/**
 * Minimal OIDC client for Beskid shell apps against Authelia.
 *
 * Authelia is the OIDC provider; each app is an OIDC client using the
 * authorization-code flow. GitHub is the sole identity provider on the
 * Authelia side (configured in Authelia, not here). This module:
 *
 *   1. discovers Authelia's endpoints via `/.well-known/openid-configuration`,
 *   2. builds the authorization redirect URL,
 *   3. exchanges the code for tokens at the token endpoint,
 *   4. verifies the ID token against Authelia's JWKS (RS256) with `jose`,
 *   5. maps the verified claims to a {@link ShellUser}.
 *
 * `jose` is the established JWT library across the Beskid ecosystem
 * (`site/auth`, `beskid_tracker`, `beskid-auth-client` all use `^6.2.3`).
 * It is the lightest correct way to verify an RS256 ID token against a
 * remote JWKS — hand-rolling JWK → PEM + RS256 verification is error-prone.
 */

interface OidcDiscovery {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	jwks_uri: string;
}

interface TokenResponse {
	id_token?: string;
	access_token?: string;
	token_type?: string;
}

export interface OidcClientConfig {
	issuer: string;
	clientId: string;
	clientSecret: string;
}

export interface OidcClient {
	/** Discover + build the Authelia authorization redirect URL. */
	buildAuthorizationUrl(state: string, redirectUri: string): Promise<string>;
	/** Exchange an authorization code for tokens at Authelia's token endpoint. */
	exchangeCode(code: string, redirectUri: string): Promise<TokenResponse>;
	/** Verify the Authelia ID token (RS256, JWKS) and map claims to ShellUser. */
	verifyIdToken(idToken: string | undefined): Promise<ShellUser | null>;
}

/** Map verified JWT claims to a {@link ShellUser}. Defensive on shapes. */
export function claimsToShellUser(payload: Record<string, unknown>): ShellUser {
	const username =
		typeof payload.preferred_username === "string"
			? payload.preferred_username
			: typeof payload.sub === "string"
				? payload.sub
				: "";
	const email = typeof payload.email === "string" ? payload.email : undefined;
	const name = typeof payload.name === "string" ? payload.name : undefined;
	const groups = Array.isArray(payload.groups)
		? payload.groups.filter((g): g is string => typeof g === "string")
		: [];
	return { username, email, name, groups };
}

export function createOidcClient(config: OidcClientConfig): OidcClient {
	const discoveryCache: Record<string, OidcDiscovery> = {};

	function requireOidcEnv(): OidcClientConfig {
		if (!config.issuer || !config.clientId || !config.clientSecret) {
			throw new Error(
				"OIDC not configured: set AUTHELIA_OIDC_ISSUER and this app's OIDC_CLIENT_ID / OIDC_CLIENT_SECRET",
			);
		}
		return config;
	}

	async function discoverIssuer(issuer: string): Promise<OidcDiscovery> {
		const cached = discoveryCache[issuer];
		if (cached) return cached;
		const wellKnown = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
		const res = await fetch(wellKnown);
		if (!res.ok) {
			throw new Error(`OIDC discovery failed: ${res.status} ${wellKnown}`);
		}
		const doc = (await res.json()) as Partial<OidcDiscovery>;
		if (
			!doc.issuer ||
			!doc.authorization_endpoint ||
			!doc.token_endpoint ||
			!doc.jwks_uri
		) {
			throw new Error("OIDC discovery document missing required endpoints");
		}
		const entry: OidcDiscovery = {
			issuer: doc.issuer,
			authorization_endpoint: doc.authorization_endpoint,
			token_endpoint: doc.token_endpoint,
			jwks_uri: doc.jwks_uri,
		};
		discoveryCache[issuer] = entry;
		return entry;
	}

	return {
		async buildAuthorizationUrl(state, redirectUri) {
			const { issuer, clientId } = requireOidcEnv();
			const doc = await discoverIssuer(issuer);
			const url = new URL(doc.authorization_endpoint);
			url.searchParams.set("client_id", clientId);
			url.searchParams.set("redirect_uri", redirectUri);
			url.searchParams.set("response_type", "code");
			url.searchParams.set("scope", "openid profile email groups");
			url.searchParams.set("state", state);
			return url.toString();
		},

		async exchangeCode(code, redirectUri) {
			const { issuer, clientId, clientSecret } = requireOidcEnv();
			const doc = await discoverIssuer(issuer);
			const body = new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
				client_id: clientId,
				client_secret: clientSecret,
			});
			const res = await fetch(doc.token_endpoint, {
				method: "POST",
				headers: { "content-type": "application/x-www-form-urlencoded" },
				body,
			});
			if (!res.ok) {
				throw new Error(`OIDC token exchange failed: ${res.status}`);
			}
			return (await res.json()) as TokenResponse;
		},

		async verifyIdToken(idToken) {
			if (!idToken) return null;
			const { issuer, clientId } = requireOidcEnv();
			const doc = await discoverIssuer(issuer);
			const JWKS = createRemoteJWKSet(new URL(doc.jwks_uri));
			try {
				const { payload } = await jwtVerify(idToken, JWKS, {
					issuer: doc.issuer,
					audience: clientId,
				});
				return claimsToShellUser(payload);
			} catch {
				return null;
			}
		},
	};
}

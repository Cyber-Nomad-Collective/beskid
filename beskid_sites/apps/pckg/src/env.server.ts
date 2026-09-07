import "@tanstack/react-start/server-only";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * pckg env.
 *
 * Auth model: pckg is an OIDC client of Authelia (authorization-code flow),
 * reusing the shell-core session-cookie pattern. GitHub is the sole identity
 * provider, configured on the Authelia side. The app verifies Authelia's ID
 * token and stores the resulting claims in a signed session cookie
 * (SESSION_SECRET). `SHELL_AUTH_MODE=mock` returns a fake user for dev.
 *
 * pckg-specific keys: the .NET registry API origin (proxied server-side and
 * same-origin client-side), and the NodeBB community integration (admin token
 * is server-only — never exposed to the client).
 */
export const env = createEnv({
	server: {
		SHELL_AUTH_MODE: z.enum(["authelia", "mock"]).default("mock"),
		/** Authelia OIDC issuer origin (e.g. http://localhost:9091). */
		AUTHELIA_OIDC_ISSUER: z.string().url().optional(),
		/** This app's OIDC client id (registered in Authelia). */
		PCKG_OIDC_CLIENT_ID: z.string().min(1).optional(),
		/** This app's OIDC client secret (from Authelia client config). */
		PCKG_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
		/** Session cookie signing key (HS256, 32+ chars). Required in production. */
		SESSION_SECRET: z.string().min(32).optional(),
		/** pckg .NET registry API origin (e.g. http://localhost:8082). */
		PCKG_API_BASE_URL: z.string().url().optional(),
		/** NodeBB community API origin (e.g. https://community.beskid-lang.org). */
		NODEBB_API_URL: z.string().url().optional(),
		/** NodeBB admin API token (server-only — never exposed to the client). */
		NODEBB_ADMIN_TOKEN: z.string().min(1).optional(),
		/** Parent category id under which per-package subforums are created. */
		NODEBB_PACKAGES_PARENT_CID: z.coerce.number().int().positive().optional(),
		/** Public community origin (used for deep-link URLs on the client). */
		COMMUNITY_URL: z.string().url().optional(),
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.optional(),
	},
	runtimeEnv: {
		SHELL_AUTH_MODE: process.env.SHELL_AUTH_MODE,
		AUTHELIA_OIDC_ISSUER: process.env.AUTHELIA_OIDC_ISSUER,
		PCKG_OIDC_CLIENT_ID: process.env.PCKG_OIDC_CLIENT_ID,
		PCKG_OIDC_CLIENT_SECRET: process.env.PCKG_OIDC_CLIENT_SECRET,
		SESSION_SECRET: process.env.SESSION_SECRET,
		PCKG_API_BASE_URL: process.env.PCKG_API_BASE_URL,
		NODEBB_API_URL: process.env.NODEBB_API_URL,
		NODEBB_ADMIN_TOKEN: process.env.NODEBB_ADMIN_TOKEN,
		NODEBB_PACKAGES_PARENT_CID: process.env.NODEBB_PACKAGES_PARENT_CID,
		COMMUNITY_URL: process.env.COMMUNITY_URL,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" ||
		process.env.NODE_ENV !== "production",
});

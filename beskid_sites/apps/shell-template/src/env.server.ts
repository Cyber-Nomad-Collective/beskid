import "@tanstack/react-start/server-only";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Shell-template env. Apps scaffolded from the template extend this with
 * their own keys (see the tracker Plan.md `extendEnv` hook note).
 *
 * Auth model: the app is an OIDC client of Authelia (authorization-code
 * flow). GitHub is the sole identity provider, configured on the Authelia
 * side (not here). The app verifies Authelia's ID token and stores the
 * resulting claims in a signed session cookie (SESSION_SECRET).
 */
export const env = createEnv({
	server: {
		SHELL_AUTH_MODE: z.enum(["authelia", "mock"]).default("mock"),
		/** Authelia OIDC issuer origin (e.g. http://localhost:9091). */
		AUTHELIA_OIDC_ISSUER: z.string().url().optional(),
		/** This app's OIDC client id (registered in Authelia). */
		SHELL_TEMPLATE_OIDC_CLIENT_ID: z.string().min(1).optional(),
		/** This app's OIDC client secret (from Authelia client config). */
		SHELL_TEMPLATE_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
		/** Session cookie signing key (HS256, 32+ chars). Required in production. */
		SESSION_SECRET: z.string().min(32).optional(),
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.optional(),
	},
	runtimeEnv: {
		SHELL_AUTH_MODE: process.env.SHELL_AUTH_MODE,
		AUTHELIA_OIDC_ISSUER: process.env.AUTHELIA_OIDC_ISSUER,
		SHELL_TEMPLATE_OIDC_CLIENT_ID: process.env.SHELL_TEMPLATE_OIDC_CLIENT_ID,
		SHELL_TEMPLATE_OIDC_CLIENT_SECRET:
			process.env.SHELL_TEMPLATE_OIDC_CLIENT_SECRET,
		SESSION_SECRET: process.env.SESSION_SECRET,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" ||
		process.env.NODE_ENV !== "production",
});

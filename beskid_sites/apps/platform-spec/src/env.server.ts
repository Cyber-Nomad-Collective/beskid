import "@tanstack/react-start/server-only";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function parseCommaList(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

/**
 * Platform-spec env.
 *
 * Auth model: this app is an OIDC client of Authelia (authorization-code
 * flow), shared with the shell template. GitHub is the sole identity
 * provider, configured on the Authelia side. `SHELL_AUTH_MODE=mock` returns
 * a fake user for local dev (no Authelia instance required).
 *
 * The previous Beskid auth-hub pairing + JWT-handoff flow has been removed
 * (see MIGRATION-NOTES.md). The GitHub-write-token needed for PR creation
 * is an open blocker.
 */
export const env = createEnv({
	server: {
		MEMGRAPH_URI: z.string().min(1).default("bolt://127.0.0.1:7687"),
		SHELL_AUTH_MODE: z.enum(["authelia", "mock"]).default("mock"),
		AUTHELIA_OIDC_ISSUER: z.string().url().optional(),
		PLATFORM_SPEC_OIDC_CLIENT_ID: z.string().min(1).optional(),
		PLATFORM_SPEC_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
		SESSION_SECRET: z.string().min(32),
		PLATFORM_SPEC_PUBLIC_URL: z.string().url().optional(),
		TRACKER_PUBLIC_URL: z.string().url().optional(),
		GITHUB_REPO_OWNER: z.string().min(1).default("Cyber-Nomad-Collective"),
		GITHUB_REPO_NAME: z.string().min(1).default("beskid"),
		GITHUB_OAUTH_REPO_OWNER: z.string().min(1).default("Cyber-Nomad-Collective"),
		GITHUB_OAUTH_REPO_NAME: z.string().min(1).default("beskid"),
		GITHUB_WEBHOOK_SECRET: z.string().min(8).optional(),
		PLATFORM_SPEC_MODERATOR_LOGINS: z
			.preprocess(
				(val) => (typeof val === "string" ? parseCommaList(val) : []),
				z.array(z.string().min(1)),
			)
			.optional()
			.default([]),
		PLATFORM_SPEC_DATA_DIR: z.string().min(1).optional(),
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.optional(),
	},
	runtimeEnv: {
		MEMGRAPH_URI: process.env.MEMGRAPH_URI,
		SHELL_AUTH_MODE: process.env.SHELL_AUTH_MODE,
		AUTHELIA_OIDC_ISSUER: process.env.AUTHELIA_OIDC_ISSUER,
		PLATFORM_SPEC_OIDC_CLIENT_ID: process.env.PLATFORM_SPEC_OIDC_CLIENT_ID,
		PLATFORM_SPEC_OIDC_CLIENT_SECRET:
			process.env.PLATFORM_SPEC_OIDC_CLIENT_SECRET,
		SESSION_SECRET: process.env.SESSION_SECRET,
		PLATFORM_SPEC_PUBLIC_URL: process.env.PLATFORM_SPEC_PUBLIC_URL,
		TRACKER_PUBLIC_URL: process.env.TRACKER_PUBLIC_URL,
		GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
		GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
		GITHUB_OAUTH_REPO_OWNER: process.env.GITHUB_OAUTH_REPO_OWNER,
		GITHUB_OAUTH_REPO_NAME: process.env.GITHUB_OAUTH_REPO_NAME,
		GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
		PLATFORM_SPEC_MODERATOR_LOGINS: process.env.PLATFORM_SPEC_MODERATOR_LOGINS,
		PLATFORM_SPEC_DATA_DIR: process.env.PLATFORM_SPEC_DATA_DIR,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" ||
		process.env.NODE_ENV !== "production",
});

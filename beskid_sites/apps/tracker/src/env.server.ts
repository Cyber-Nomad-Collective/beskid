import "@tanstack/react-start/server-only";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Tracker env.
 *
 * Auth model: the tracker is an OIDC client of Authelia (authorization-code
 * flow), reusing the shell-template's session-cookie pattern. GitHub is the
 * sole identity provider, configured on the Authelia side. The app verifies
 * Authelia's ID token and stores the resulting claims in a signed session
 * cookie (SESSION_SECRET). `SHELL_AUTH_MODE=mock` returns a fake user for dev.
 *
 * Tracker-specific keys: GitHub repo coordinates, optional PATs for bug
 * sync, the SQLite data dir, the public tracker URL (webhook payload), and the
 * webhook secret. The old auth-hub keys (AUTH_HUB_*, TRACKER_PAIRING_*,
 * TRACKER_SETUP_TOKEN, GITHUB_OAUTH_CALLBACK_URL) are gone.
 */
export const env = createEnv({
	server: {
		SHELL_AUTH_MODE: z.enum(["authelia", "mock"]).default("mock"),
		/** Authelia OIDC issuer origin (e.g. http://localhost:9091). */
		AUTHELIA_OIDC_ISSUER: z.string().url().optional(),
		/** This app's OIDC client id (registered in Authelia). */
		TRACKER_OIDC_CLIENT_ID: z.string().min(1).optional(),
		/** This app's OIDC client secret (from Authelia client config). */
		TRACKER_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
		/** Session cookie signing key (HS256, 32+ chars). Required in production. */
		SESSION_SECRET: z.string().min(32).optional(),
		GITHUB_REPO_OWNER: z.string().min(1).default("Cyber-Nomad-Collective"),
		GITHUB_REPO_NAME: z.string().min(1).default("beskid"),
		/** Optional PAT for public issue reads (avoids unauthenticated rate limits). */
		GITHUB_PUBLIC_READ_TOKEN: z.string().min(1).optional(),
		/** Optional PAT for server-side bug export to GitHub Issues. */
		GITHUB_SYNC_TOKEN: z.string().min(1).optional(),
		/** SQLite data directory (defaults to data/runtime under the app). */
		TRACKER_DATA_DIR: z.string().min(1).optional(),
		/** Public tracker origin — the GitHub webhook payload URL base. */
		TRACKER_PUBLIC_URL: z.string().url().optional(),
		/** HMAC secret for inbound GitHub issue webhooks. */
		GITHUB_WEBHOOK_SECRET: z.string().min(8).optional(),
		/** Authelia group that maps to repo-maintainer (canManageRoadmap). */
		TRACKER_MAINTAINER_GROUP: z.string().min(1).default("beskid-admins"),
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.optional(),
	},
	runtimeEnv: {
		SHELL_AUTH_MODE: process.env.SHELL_AUTH_MODE,
		AUTHELIA_OIDC_ISSUER: process.env.AUTHELIA_OIDC_ISSUER,
		TRACKER_OIDC_CLIENT_ID: process.env.TRACKER_OIDC_CLIENT_ID,
		TRACKER_OIDC_CLIENT_SECRET: process.env.TRACKER_OIDC_CLIENT_SECRET,
		SESSION_SECRET: process.env.SESSION_SECRET,
		GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
		GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
		GITHUB_PUBLIC_READ_TOKEN: process.env.GITHUB_PUBLIC_READ_TOKEN,
		GITHUB_SYNC_TOKEN: process.env.GITHUB_SYNC_TOKEN,
		TRACKER_DATA_DIR: process.env.TRACKER_DATA_DIR,
		TRACKER_PUBLIC_URL: process.env.TRACKER_PUBLIC_URL,
		GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
		TRACKER_MAINTAINER_GROUP: process.env.TRACKER_MAINTAINER_GROUP,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" ||
		process.env.NODE_ENV !== "production",
});

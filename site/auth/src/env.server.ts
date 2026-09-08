import "@tanstack/react-start/server-only";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		AUTH_HUB_PUBLIC_URL: z.string().url(),
		AUTH_HUB_SECRET: z.string().min(32).optional(),
		SESSION_SECRET: z.string().min(32),
		GITHUB_CLIENT_ID: z.string().min(1).optional(),
		GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
		GITHUB_OAUTH_CALLBACK_URL: z.string().url().optional(),
		AUTH_SETUP_TOKEN: z.string().min(8).optional(),
		AUTH_DATA_DIR: z.string().min(1).optional(),
		TRACKER_PUBLIC_URL: z.string().url().optional(),
		NEXUS_PUBLIC_URL: z.string().url().optional(),
		PCKG_PUBLIC_URL: z.string().url().optional(),
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.optional(),
	},
	runtimeEnv: {
		AUTH_HUB_PUBLIC_URL: process.env.AUTH_HUB_PUBLIC_URL,
		AUTH_HUB_SECRET: process.env.AUTH_HUB_SECRET,
		SESSION_SECRET: process.env.SESSION_SECRET,
		GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
		GITHUB_OAUTH_CALLBACK_URL: process.env.GITHUB_OAUTH_CALLBACK_URL,
		AUTH_SETUP_TOKEN: process.env.AUTH_SETUP_TOKEN,
		AUTH_DATA_DIR: process.env.AUTH_DATA_DIR,
		TRACKER_PUBLIC_URL: process.env.TRACKER_PUBLIC_URL,
		NEXUS_PUBLIC_URL: process.env.NEXUS_PUBLIC_URL,
		PCKG_PUBLIC_URL: process.env.PCKG_PUBLIC_URL,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" ||
		process.env.NODE_ENV !== "production",
});

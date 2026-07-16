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

export const env = createEnv({
	server: {
		MEMGRAPH_URI: z.string().min(1).default("bolt://127.0.0.1:7687"),
		AUTH_HUB_PUBLIC_URL: z.string().url(),
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
		PLATFORM_SPEC_PAIRING_APPROVER_LOGIN: z.string().min(1).optional(),
		PLATFORM_SPEC_SETUP_TOKEN: z.string().min(8).optional(),
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.optional(),
	},
	runtimeEnv: {
		MEMGRAPH_URI: process.env.MEMGRAPH_URI,
		AUTH_HUB_PUBLIC_URL: process.env.AUTH_HUB_PUBLIC_URL,
		SESSION_SECRET: process.env.SESSION_SECRET,
		PLATFORM_SPEC_PUBLIC_URL: process.env.PLATFORM_SPEC_PUBLIC_URL,
		TRACKER_PUBLIC_URL: process.env.TRACKER_PUBLIC_URL,
		GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
		GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
		GITHUB_OAUTH_REPO_OWNER: process.env.GITHUB_OAUTH_REPO_OWNER,
		GITHUB_OAUTH_REPO_NAME: process.env.GITHUB_OAUTH_REPO_NAME,
		GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
		PLATFORM_SPEC_MODERATOR_LOGINS:
			process.env.PLATFORM_SPEC_MODERATOR_LOGINS,
		PLATFORM_SPEC_DATA_DIR: process.env.PLATFORM_SPEC_DATA_DIR,
		PLATFORM_SPEC_PAIRING_APPROVER_LOGIN:
			process.env.PLATFORM_SPEC_PAIRING_APPROVER_LOGIN,
		PLATFORM_SPEC_SETUP_TOKEN: process.env.PLATFORM_SPEC_SETUP_TOKEN,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" ||
		process.env.NODE_ENV !== "production",
});

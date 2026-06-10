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
		GITHUB_REPO_OWNER: z.string().min(1).default("Cyber-Nomad-Collective"),
		GITHUB_REPO_NAME: z.string().min(1).default("beskid_normative_spec"),
		GITHUB_OAUTH_REPO_OWNER: z.string().min(1).default("Cyber-Nomad-Collective"),
		GITHUB_OAUTH_REPO_NAME: z.string().min(1).default("beskid"),
		GITHUB_SYNC_TOKEN: z.string().min(1).optional(),
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
		SPEC_GIT_REPO_URL: z.string().url().optional(),
		SPEC_GIT_REF: z.string().min(1).default("main"),
		SPEC_GIT_CONTENT_PATH: z.string().min(1).default("platform-spec"),
		SPEC_LOCAL_WORKSPACE: z.string().min(1).optional(),
		SPEC_GIT_CLONE_DIR: z.string().min(1).optional(),
		SPEC_SYNC_MODE: z.enum(["json", "mdx-legacy"]).default("json"),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.optional(),
	},
	runtimeEnv: {
		MEMGRAPH_URI: process.env.MEMGRAPH_URI,
		AUTH_HUB_PUBLIC_URL: process.env.AUTH_HUB_PUBLIC_URL,
		SESSION_SECRET: process.env.SESSION_SECRET,
		PLATFORM_SPEC_PUBLIC_URL: process.env.PLATFORM_SPEC_PUBLIC_URL,
		GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
		GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
		GITHUB_OAUTH_REPO_OWNER: process.env.GITHUB_OAUTH_REPO_OWNER,
		GITHUB_OAUTH_REPO_NAME: process.env.GITHUB_OAUTH_REPO_NAME,
		GITHUB_SYNC_TOKEN: process.env.GITHUB_SYNC_TOKEN,
		GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
		PLATFORM_SPEC_MODERATOR_LOGINS:
			process.env.PLATFORM_SPEC_MODERATOR_LOGINS,
		PLATFORM_SPEC_DATA_DIR: process.env.PLATFORM_SPEC_DATA_DIR,
		PLATFORM_SPEC_PAIRING_APPROVER_LOGIN:
			process.env.PLATFORM_SPEC_PAIRING_APPROVER_LOGIN,
		PLATFORM_SPEC_SETUP_TOKEN: process.env.PLATFORM_SPEC_SETUP_TOKEN,
		SPEC_GIT_REPO_URL: process.env.SPEC_GIT_REPO_URL,
		SPEC_GIT_REF: process.env.SPEC_GIT_REF,
		SPEC_GIT_CONTENT_PATH: process.env.SPEC_GIT_CONTENT_PATH,
		SPEC_LOCAL_WORKSPACE: process.env.SPEC_LOCAL_WORKSPACE,
		SPEC_GIT_CLONE_DIR: process.env.SPEC_GIT_CLONE_DIR,
		SPEC_SYNC_MODE: process.env.SPEC_SYNC_MODE,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" ||
		process.env.NODE_ENV !== "production",
});

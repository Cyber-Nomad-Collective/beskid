import "@tanstack/react-start/server-only";

import { z } from "zod";

import { env } from "#/env.server";
import { getSettingsDatabase } from "#/lib/storage/db";

export const DEFAULT_NORMATIVE_SPEC_REPO_URL =
	"https://github.com/Cyber-Nomad-Collective/beskid_normative_spec.git";

const KEY_NORMATIVE_SPEC_REPO_URL = "normative_spec_repo_url";

const githubRepoUrlSchema = z
	.string()
	.url()
	.refine(
		(value) =>
			/^https:\/\/github\.com\/[^/]+\/[^/]+(?:\.git)?\/?$/i.test(value),
		"Must be a GitHub repository URL (https://github.com/owner/repo)",
	);

export interface NormativeRepoConfig {
	repoUrl: string;
	owner: string;
	repo: string;
	ref: string;
	contentPath: string;
	source: "env" | "stored" | "default";
}

function getStoredRepoUrl(): string | null {
	const row = getSettingsDatabase()
		.query<{ value: string }, [string]>(
			"SELECT value FROM app_settings WHERE key = ?",
		)
		.get(KEY_NORMATIVE_SPEC_REPO_URL);
	return row?.value?.trim() ?? null;
}

export function parseGithubRepoUrl(repoUrl: string): { owner: string; repo: string } {
	const normalized = repoUrl
		.trim()
		.replace(/\.git\/?$/i, "")
		.replace(/\/$/, "");
	const match = normalized.match(/github\.com\/([^/]+)\/([^/]+)$/i);
	if (!match) {
		throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
	}
	return {
		owner: match[1]!,
		repo: match[2]!,
	};
}

export function resolveNormativeRepoConfig(): NormativeRepoConfig {
	const envUrl = env.SPEC_GIT_REPO_URL?.trim();
	if (envUrl) {
		const { owner, repo } = parseGithubRepoUrl(envUrl);
		return {
			repoUrl: envUrl,
			owner,
			repo,
			ref: env.SPEC_GIT_REF,
			contentPath: env.SPEC_GIT_CONTENT_PATH,
			source: "env",
		};
	}

	const storedUrl = getStoredRepoUrl();
	if (storedUrl) {
		const { owner, repo } = parseGithubRepoUrl(storedUrl);
		return {
			repoUrl: storedUrl,
			owner,
			repo,
			ref: env.SPEC_GIT_REF,
			contentPath: env.SPEC_GIT_CONTENT_PATH,
			source: "stored",
		};
	}

	const { owner, repo } = parseGithubRepoUrl(DEFAULT_NORMATIVE_SPEC_REPO_URL);
	return {
		repoUrl: DEFAULT_NORMATIVE_SPEC_REPO_URL,
		owner,
		repo,
		ref: env.SPEC_GIT_REF,
		contentPath: env.SPEC_GIT_CONTENT_PATH,
		source: "default",
	};
}

export function getNormativeRepoSettings(): {
	repoUrl: string;
	source: NormativeRepoConfig["source"];
	defaultRepoUrl: string;
} {
	const config = resolveNormativeRepoConfig();
	return {
		repoUrl: config.repoUrl,
		source: config.source,
		defaultRepoUrl: DEFAULT_NORMATIVE_SPEC_REPO_URL,
	};
}

export function saveNormativeRepoUrl(repoUrl: string): NormativeRepoConfig {
	const parsed = githubRepoUrlSchema.parse(repoUrl.trim());
	parseGithubRepoUrl(parsed);

	getSettingsDatabase()
		.prepare(
			`INSERT OR REPLACE INTO app_settings (key, value, updated_at)
			 VALUES (?, ?, datetime('now'))`,
		)
		.run(KEY_NORMATIVE_SPEC_REPO_URL, parsed.replace(/\/$/, ""));

	return resolveNormativeRepoConfig();
}

import "@tanstack/react-start/server-only";

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { env } from "#/env.server";
import { resolveNormativeRepoConfig } from "#/lib/spec-repo-settings.server";

export interface GitCloneResult {
	cloneDir: string;
	contentRoot: string;
	headSha: string | null;
	ref: string;
}

function defaultCloneDir(): string {
	if (env.SPEC_GIT_CLONE_DIR?.trim()) {
		return path.resolve(env.SPEC_GIT_CLONE_DIR);
	}
	const dataDir =
		env.PLATFORM_SPEC_DATA_DIR?.trim() ??
		path.resolve(import.meta.dirname, "../../../data/runtime");
	return path.join(dataDir, "git-clone");
}

function authRepoUrl(repoUrl: string): string {
	const token = env.GITHUB_SYNC_TOKEN?.trim();
	if (!token || !repoUrl.startsWith("https://github.com/")) {
		return repoUrl;
	}
	return repoUrl.replace(
		"https://github.com/",
		`https://x-access-token:${token}@github.com/`,
	);
}

export function resolveGitContentRoot(): string {
	const cloneDir = defaultCloneDir();
	const contentPath = env.SPEC_GIT_CONTENT_PATH.replace(/^\/+/, "");
	return path.join(cloneDir, contentPath);
}

export function syncGitRepository(): GitCloneResult {
	const { repoUrl, ref } = resolveNormativeRepoConfig();
	if (!repoUrl) {
		throw new Error("Normative spec repository URL is not configured");
	}

	const cloneDir = defaultCloneDir();
	const authedUrl = authRepoUrl(repoUrl);

	fs.mkdirSync(path.dirname(cloneDir), { recursive: true });

	if (!fs.existsSync(path.join(cloneDir, ".git"))) {
		execSync(
			`git clone --depth 1 --branch ${ref} ${JSON.stringify(authedUrl)} ${JSON.stringify(cloneDir)}`,
			{ stdio: "pipe" },
		);
	} else {
		execSync("git fetch --depth 1 origin", {
			cwd: cloneDir,
			stdio: "pipe",
			env: {
				...process.env,
				GIT_TERMINAL_PROMPT: "0",
			},
		});
		execSync(`git checkout ${ref}`, { cwd: cloneDir, stdio: "pipe" });
		execSync("git reset --hard FETCH_HEAD", { cwd: cloneDir, stdio: "pipe" });
	}

	let headSha: string | null = null;
	try {
		headSha = execSync("git rev-parse HEAD", {
			cwd: cloneDir,
			encoding: "utf8",
		}).trim();
	} catch {
		headSha = null;
	}

	return {
		cloneDir,
		contentRoot: resolveGitContentRoot(),
		headSha,
		ref,
	};
}

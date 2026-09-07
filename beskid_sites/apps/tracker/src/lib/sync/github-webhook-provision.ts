import type { Octokit } from "@octokit/rest";

import { repoParams } from "#/lib/github/octokit";
import {
	getGithubWebhookSecret,
	githubRepositoryWebhookAdminUrl,
	githubWebhookUrl,
} from "#/lib/sync/github-webhook-config";

export interface ProvisionGithubWebhookResult {
	action: "created" | "updated";
	hookId: number;
	adminUrl: string;
	payloadUrl: string;
}

export async function provisionRepositoryIssuesWebhook(
	octokit: Octokit,
): Promise<ProvisionGithubWebhookResult> {
	const secret = getGithubWebhookSecret();
	if (!secret) {
		throw new Error(
			"Save a webhook secret in Settings before creating the GitHub webhook",
		);
	}

	const payloadUrl = githubWebhookUrl();
	const { owner, repo } = repoParams();

	const { data: hooks } = await octokit.rest.repos.listWebhooks({
		owner,
		repo,
		per_page: 100,
	});

	const existing = hooks.find((hook) => hook.config?.url === payloadUrl);

	const config = {
		url: payloadUrl,
		content_type: "json" as const,
		insecure_ssl: "0" as const,
		secret,
	};

	if (existing) {
		await octokit.rest.repos.updateWebhook({
			owner,
			repo,
			hook_id: existing.id,
			events: ["issues"],
			active: true,
			config,
		});
		return {
			action: "updated",
			hookId: existing.id,
			adminUrl: githubRepositoryWebhookAdminUrl(existing.id),
			payloadUrl,
		};
	}

	const { data } = await octokit.rest.repos.createWebhook({
		owner,
		repo,
		name: "web",
		active: true,
		events: ["issues"],
		config,
	});

	return {
		action: "created",
		hookId: data.id,
		adminUrl: githubRepositoryWebhookAdminUrl(data.id),
		payloadUrl,
	};
}

process.env.AUTH_HUB_PUBLIC_URL ??= "https://auth.example.test";
process.env.SESSION_SECRET ??= "platform-spec-test-session-secret-32chars";
process.env.GITHUB_WEBHOOK_SECRET = "webhook-secret";

import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

const markMerged = vi.fn(async () => ({
	context: { id: "ctx-1", status: "merged" },
}));
const markAbandoned = vi.fn(async () => ({
	context: { id: "ctx-1", status: "abandoned" },
}));
const findByPr = vi.fn(async () => ({
	context: { id: "ctx-1", status: "approved" },
}));

vi.mock("#/server/memgraph/draft-contexts", () => ({
	findDraftContextByPrNumber: findByPr,
	findDraftContextByHeadBranch: vi.fn(async () => null),
	markDraftContextMerged: markMerged,
	markDraftContextAbandoned: markAbandoned,
}));

const { handleGithubWebhook } = await import("./webhook");

function signedRequest(_body: object, _action = "closed", merged = true) {
	const payload = JSON.stringify({
		action: "closed",
		pull_request: {
			merged,
			number: 9,
			head: { ref: "openspec/platform-editor-abc" },
		},
	});
	const signature = `sha256=${createHmac("sha256", "webhook-secret")
		.update(payload)
		.digest("hex")}`;
	return new Request("http://localhost/api/webhooks/github", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-github-event": "pull_request",
			"x-hub-signature-256": signature,
		},
		body: payload,
	});
}

describe("github webhook draft context lifecycle", () => {
	it("marks merged pull requests as merged", async () => {
		markMerged.mockClear();
		markAbandoned.mockClear();
		const response = await handleGithubWebhook(signedRequest({}, "closed", true));
		expect(response.status).toBe(200);
		expect(markMerged).toHaveBeenCalledWith("ctx-1");
		expect(markAbandoned).not.toHaveBeenCalled();
	});

	it("marks closed unmerged pull requests as abandoned", async () => {
		markMerged.mockClear();
		markAbandoned.mockClear();
		const response = await handleGithubWebhook(
			signedRequest({}, "closed", false),
		);
		expect(response.status).toBe(200);
		const json = (await response.json()) as { status?: string };
		expect(json.status).toBe("abandoned");
		expect(markAbandoned).toHaveBeenCalledWith("ctx-1");
	});
});

import "@tanstack/react-start/server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "#/env.server";
import {
	findDraftByHeadBranch,
	findDraftByPrNumber,
	markDraftMerged,
} from "#/server/memgraph/drafts";

function verifyGithubSignature(
	payload: string,
	signature: string | null,
): boolean {
	const secret = env.GITHUB_WEBHOOK_SECRET?.trim();
	if (!secret) return false;
	if (!signature?.startsWith("sha256=")) return false;

	const expected = createHmac("sha256", secret)
		.update(payload, "utf8")
		.digest("hex");
	const received = signature.slice("sha256=".length);

	try {
		return timingSafeEqual(
			Buffer.from(expected, "hex"),
			Buffer.from(received, "hex"),
		);
	} catch {
		return false;
	}
}

interface PullRequestPayload {
	action?: string;
	pull_request?: {
		merged?: boolean;
		number?: number;
		head?: { ref?: string };
	};
}

export async function handleGithubWebhook(
	request: Request,
): Promise<Response> {
	const secret = env.GITHUB_WEBHOOK_SECRET?.trim();
	if (!secret) {
		return Response.json({ error: "Webhook secret not configured" }, { status: 503 });
	}

	const payload = await request.text();
	const signature = request.headers.get("x-hub-signature-256");
	if (!verifyGithubSignature(payload, signature)) {
		return Response.json({ error: "Invalid signature" }, { status: 401 });
	}

	const event = request.headers.get("x-github-event");
	if (event !== "pull_request") {
		return Response.json({ ok: true, ignored: true });
	}

	let body: PullRequestPayload;
	try {
		body = JSON.parse(payload) as PullRequestPayload;
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (body.action !== "closed" || !body.pull_request?.merged) {
		return Response.json({ ok: true, ignored: true });
	}

	const prNumber = body.pull_request.number;
	const headRef = body.pull_request.head?.ref;

	let draft =
		typeof prNumber === "number"
			? await findDraftByPrNumber(prNumber)
			: null;

	if (!draft && headRef) {
		draft = await findDraftByHeadBranch(headRef);
	}

	if (!draft) {
		return Response.json({ ok: true, matched: false });
	}

	if (draft.status === "merged") {
		return Response.json({ ok: true, draftId: draft.id, alreadyMerged: true });
	}

	await markDraftMerged(draft.id);
	return Response.json({
		ok: true,
		draftId: draft.id,
		status: "merged",
		catalogRefresh: "filesystem-on-request",
	});
}

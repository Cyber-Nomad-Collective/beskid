import "@tanstack/react-start/server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "#/env.server";
import {
	findDraftContextByHeadBranch,
	findDraftContextByPrNumber,
	markDraftContextAbandoned,
	markDraftContextMerged,
} from "#/server/memgraph/draft-contexts";

function webhookSecret(): string | undefined {
	return (process.env.GITHUB_WEBHOOK_SECRET ?? env.GITHUB_WEBHOOK_SECRET)?.trim();
}

function verifyGithubSignature(
	payload: string,
	signature: string | null,
): boolean {
	const secret = webhookSecret();
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
	const secret = webhookSecret();
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

	if (body.action !== "closed") {
		return Response.json({ ok: true, ignored: true });
	}

	const prNumber = body.pull_request?.number;
	const headRef = body.pull_request?.head?.ref;
	const merged = Boolean(body.pull_request?.merged);

	let draft =
		typeof prNumber === "number"
			? await findDraftContextByPrNumber(prNumber)
			: null;

	if (!draft && headRef) {
		draft = await findDraftContextByHeadBranch(headRef);
	}

	if (!draft) {
		return Response.json({ ok: true, matched: false });
	}

	if (merged) {
		if (draft.context.status === "merged") {
			return Response.json({
				ok: true,
				draftId: draft.context.id,
				alreadyMerged: true,
			});
		}
		await markDraftContextMerged(draft.context.id);
		return Response.json({
			ok: true,
			draftId: draft.context.id,
			status: "merged",
			catalogRefresh: "filesystem-on-request",
		});
	}

	if (draft.context.status === "merged") {
		return Response.json({
			ok: true,
			draftId: draft.context.id,
			ignored: true,
			reason: "already-merged",
		});
	}

	await markDraftContextAbandoned(draft.context.id);
	return Response.json({
		ok: true,
		draftId: draft.context.id,
		status: "abandoned",
	});
}

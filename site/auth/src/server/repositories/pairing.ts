import type { AuthAppId } from "@beskid/auth-client";

import { env } from "#/env.server";
import {
	hashPairingCode,
	pairingCode,
	randomToken,
} from "#/server/crypto";
import { getAuthDatabase } from "#/server/db/index";
import { upsertPairedApp } from "#/server/repositories/paired-apps";

const PAIRING_TTL_MS = 24 * 60 * 60 * 1000;

export interface PairingRequestRow {
	id: string;
	app_id: string;
	public_url: string;
	code_hash: string;
	expires_at: string;
	created_by_login: string;
	status: string;
	created_at: string;
}

function audit(
	requestId: string,
	event: string,
	actorLogin: string | null,
): void {
	getAuthDatabase()
		.prepare(
			"INSERT INTO pairing_audit (request_id, event, actor_login) VALUES (?, ?, ?)",
		)
		.run(requestId, event, actorLogin);
}

export function createPairingRequest(input: {
	appId: AuthAppId;
	publicUrl: string;
	createdByLogin: string;
}): {
	requestId: string;
	pairingCode: string;
	expiresAt: string;
	approveUrlTemplate: string;
} {
	const db = getAuthDatabase();
	const requestId = randomToken(16);
	const code = pairingCode();
	const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString();
	const publicUrl = input.publicUrl.replace(/\/$/, "");

	db.prepare(
		`INSERT INTO pairing_requests
		 (id, app_id, public_url, code_hash, expires_at, created_by_login, status)
		 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
	).run(
		requestId,
		input.appId,
		publicUrl,
		hashPairingCode(code, requestId),
		expiresAt,
		input.createdByLogin,
	);

	audit(requestId, "created", input.createdByLogin);

	const hubBase = env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");
	return {
		requestId,
		pairingCode: code,
		expiresAt,
		approveUrlTemplate: `${publicUrl}/settings/auth/pair?code=${encodeURIComponent(code)}`,
	};
}

function findPendingByCode(code: string): PairingRequestRow | null {
	const rows = getAuthDatabase()
		.query<PairingRequestRow, []>(
			"SELECT * FROM pairing_requests WHERE status = 'pending'",
		)
		.all();

	const now = Date.now();
	for (const row of rows) {
		if (new Date(row.expires_at).getTime() < now) continue;
		if (hashPairingCode(code, row.id) === row.code_hash) return row;
	}
	return null;
}

export function approvePairing(input: {
	code: string;
	appId: AuthAppId;
	publicUrl: string;
	approverLogin: string;
}): { serviceToken: string } | { error: string } {
	const row = findPendingByCode(input.code.trim());
	if (!row) return { error: "Invalid or expired pairing code" };

	if (row.app_id !== input.appId) {
		return { error: "App id does not match pairing request" };
	}

	const normalizedUrl = input.publicUrl.replace(/\/$/, "");
	if (row.public_url !== normalizedUrl) {
		return { error: "Public URL does not match pairing request" };
	}

	const serviceToken = randomToken(32);
	const db = getAuthDatabase();

	db.prepare(
		"UPDATE pairing_requests SET status = 'approved' WHERE id = ?",
	).run(row.id);

	upsertPairedApp({
		id: input.appId,
		publicUrl: normalizedUrl,
		serviceToken,
		approvedByLogin: input.approverLogin,
	});

	audit(row.id, "approved", input.approverLogin);

	return { serviceToken };
}

export function listPairingRequests(): PairingRequestRow[] {
	return getAuthDatabase()
		.query<PairingRequestRow, []>(
			"SELECT * FROM pairing_requests ORDER BY created_at DESC LIMIT 50",
		)
		.all();
}

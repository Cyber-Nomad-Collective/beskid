import type { AuthAppId } from "@beskid/auth-client";
import { AUTH_APP_META } from "@beskid/auth-client";

import { env } from "#/env.server";
import { hashSecret } from "#/server/crypto";
import {
	getAuthDatabase,
	getEncryptedHubSetting,
	setEncryptedHubSetting,
} from "#/server/db/index";

export interface PairedAppRow {
	id: string;
	public_url: string;
	handoff_secret_hash: string;
	service_token_hash: string | null;
	status: string;
	paired_at: string;
	approved_by_login: string;
}

export function upsertPairedApp(input: {
	id: AuthAppId;
	publicUrl: string;
	serviceToken: string;
	approvedByLogin: string;
}): void {
	const db = getAuthDatabase();
	const tokenHash = hashSecret(input.serviceToken);
	db.prepare(
		`INSERT OR REPLACE INTO paired_apps
		 (id, public_url, handoff_secret_hash, service_token_hash, status, paired_at, approved_by_login)
		 VALUES (?, ?, ?, ?, 'active', datetime('now'), ?)`,
	).run(
		input.id,
		input.publicUrl.replace(/\/$/, ""),
		tokenHash,
		tokenHash,
		input.approvedByLogin,
	);
	setEncryptedHubSetting(`service_token:${input.id}`, input.serviceToken);
}

export function getPairedApp(appId: string): PairedAppRow | null {
	return (
		getAuthDatabase()
			.query<PairedAppRow, [string]>(
				"SELECT * FROM paired_apps WHERE id = ? AND status = 'active'",
			)
			.get(appId) ?? null
	);
}

export function listActivePairedApps(): PairedAppRow[] {
	return getAuthDatabase()
		.query<PairedAppRow, []>(
			"SELECT * FROM paired_apps WHERE status = 'active' ORDER BY id",
		)
		.all();
}

export async function listEnabledApps(): Promise<
	Array<{
		id: AuthAppId;
		label: string;
		description: string;
		publicUrl: string;
		finishUrl: string;
		loginUrl: string;
	}>
> {
	const hubBase = env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");
	return listActivePairedApps().map((row) => ({
		id: row.id as AuthAppId,
		label: AUTH_APP_META[row.id as AuthAppId].label,
		description: AUTH_APP_META[row.id as AuthAppId].description,
		publicUrl: row.public_url,
		finishUrl: `${row.public_url}/api/auth/hub-finish`,
		loginUrl: `${hubBase}/login?app=${row.id}`,
	}));
}

export function getServiceTokenForApp(appId: string): string | null {
	const fromDb = getEncryptedHubSetting(`service_token:${appId}`);
	if (fromDb && fromDb.length >= 32) return fromDb;
	const row = getPairedApp(appId);
	if (!row) return null;
	const legacy = env.AUTH_HUB_SECRET?.trim();
	return legacy && legacy.length >= 32 ? legacy : null;
}

export function verifyServiceToken(appId: string, token: string): boolean {
	const expected = getServiceTokenForApp(appId);
	if (!expected) return false;
	return hashSecret(token) === hashSecret(expected);
}

export function isAppPaired(appId: string): boolean {
	return getServiceTokenForApp(appId) !== null;
}

/** @deprecated use getServiceTokenForApp */
export function getHandoffSecretForApp(appId: string): string | null {
	return getServiceTokenForApp(appId);
}

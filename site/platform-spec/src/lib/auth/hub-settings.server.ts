import "@tanstack/react-start/server-only";

import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "node:crypto";

import { env } from "#/env.server";
import { getSettingsDatabase } from "#/lib/storage/db";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

const KEY_HUB_URL = "auth_hub_url";
const KEY_SERVICE_TOKEN = "auth_hub_service_token";
const KEY_PAIRING_APPROVER_LOGIN = "platform_spec_pairing_approver_login";

function encryptionKey(): Buffer {
	return scryptSync(env.SESSION_SECRET, "beskid-platform-spec-auth-hub", 32);
}

function encrypt(plaintext: string): string {
	const key = encryptionKey();
	const iv = randomBytes(IV_LEN);
	const cipher = createCipheriv(ALGO, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decrypt(payload: string): string {
	const key = encryptionKey();
	const buf = Buffer.from(payload, "base64url");
	const iv = buf.subarray(0, IV_LEN);
	const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
	const data = buf.subarray(IV_LEN + TAG_LEN);
	const decipher = createDecipheriv(ALGO, key, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(data), decipher.final()]).toString(
		"utf8",
	);
}

function getSetting(key: string): string | null {
	const row = getSettingsDatabase()
		.query<{ value: string }, [string]>(
			"SELECT value FROM app_settings WHERE key = ?",
		)
		.get(key);
	return row?.value ?? null;
}

function setSetting(key: string, value: string): void {
	getSettingsDatabase()
		.prepare(
			`INSERT OR REPLACE INTO app_settings (key, value, updated_at)
			 VALUES (?, ?, datetime('now'))`,
		)
		.run(key, value);
}

export function getAuthHubUrl(): string | null {
	return getSetting(KEY_HUB_URL) ?? env.AUTH_HUB_PUBLIC_URL?.trim() ?? null;
}

export function getAuthHubServiceToken(): string | null {
	const stored = getSetting(KEY_SERVICE_TOKEN);
	if (stored) {
		try {
			return decrypt(stored);
		} catch {
			return null;
		}
	}
	return null;
}

export function saveAuthHubPairing(hubUrl: string, serviceToken: string): void {
	setSetting(KEY_HUB_URL, hubUrl.replace(/\/$/, ""));
	setSetting(KEY_SERVICE_TOKEN, encrypt(serviceToken));
}

export function getStoredPairingApproverLogin(): string | null {
	return getSetting(KEY_PAIRING_APPROVER_LOGIN);
}

export function savePairingApproverLogin(login: string): void {
	setSetting(KEY_PAIRING_APPROVER_LOGIN, login.trim().toLowerCase());
}

export function isAuthHubPaired(): boolean {
	return getAuthHubServiceToken() !== null && getAuthHubUrl() !== null;
}

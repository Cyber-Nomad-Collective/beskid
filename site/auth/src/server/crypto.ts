import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { env } from "#/env.server";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function masterKey(): Buffer {
	const raw = env.SESSION_SECRET?.trim() || "";
	if (raw.length < 32) {
		throw new Error("SESSION_SECRET must be at least 32 characters");
	}
	return scryptSync(raw, "beskid-auth-hub", 32);
}

export function encryptSecret(plaintext: string): string {
	const key = masterKey();
	const iv = randomBytes(IV_LEN);
	const cipher = createCipheriv(ALGO, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSecret(payload: string): string {
	const key = masterKey();
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

export function hashSecret(plaintext: string): string {
	return scryptSync(plaintext, "beskid-handoff", 32).toString("base64url");
}

export function hashPairingCode(code: string, requestId: string): string {
	return scryptSync(code, `pairing:${requestId}`, 32).toString("base64url");
}

export function randomToken(bytes = 32): string {
	return randomBytes(bytes).toString("base64url");
}

export function pairingCode(): string {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const codeLength = 8;
	const alphabetLength = alphabet.length;
	if (alphabetLength < 2 || alphabetLength > 256) {
		throw new Error("pairingCode alphabet length must be between 2 and 256");
	}

	let out = "";
	// Reject bytes in the tail range to keep a uniform distribution.
	const maxUnbiasedByte = 256 - (256 % alphabetLength);
	while (out.length < codeLength) {
		const bytes = randomBytes(codeLength);
		for (const value of bytes) {
			if (value >= maxUnbiasedByte) {
				continue;
			}
			out += alphabet[value % alphabetLength];
			if (out.length === codeLength) {
				break;
			}
		}
	}

	return out;
}

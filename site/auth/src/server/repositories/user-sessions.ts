import { decryptSecret, encryptSecret, randomToken } from "#/server/crypto";
import { getAuthDatabase } from "#/server/db/index";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface UserSessionRow {
	id: string;
	github_token_encrypted: string;
	login: string;
	avatar_url: string;
	name: string | null;
	expires_at: string;
}

export function createUserSession(input: {
	githubAccessToken: string;
	login: string;
	avatarUrl: string;
	name: string | null;
}): string {
	const id = randomToken(16);
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
	getAuthDatabase()
		.prepare(
			`INSERT INTO user_sessions
			 (id, github_token_encrypted, login, avatar_url, name, expires_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.run(
			id,
			encryptSecret(input.githubAccessToken),
			input.login,
			input.avatarUrl,
			input.name,
			expiresAt,
		);
	return id;
}

export function getUserSession(sessionId: string): UserSessionRow | null {
	const row =
		getAuthDatabase()
			.query<UserSessionRow, [string]>(
				"SELECT * FROM user_sessions WHERE id = ?",
			)
			.get(sessionId) ?? null;
	if (!row) return null;
	if (new Date(row.expires_at).getTime() < Date.now()) {
		deleteUserSession(sessionId);
		return null;
	}
	return row;
}

export function getGithubTokenForSession(sessionId: string): string | null {
	const row = getUserSession(sessionId);
	if (!row) return null;
	try {
		return decryptSecret(row.github_token_encrypted);
	} catch {
		return null;
	}
}

export function deleteUserSession(sessionId: string): void {
	getAuthDatabase()
		.prepare("DELETE FROM user_sessions WHERE id = ?")
		.run(sessionId);
}

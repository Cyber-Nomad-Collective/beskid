import "@tanstack/react-start/server-only";

import { getHubSetting, setHubSetting } from "#/server/db/index";

const ADMIN_SETTING_KEY = "admin_github_logins";

function normalizeLogin(login: string): string {
	return login.trim().toLowerCase();
}

export function getAdminLogins(): string[] {
	const adminRaw = getHubSetting(ADMIN_SETTING_KEY);
	if (!adminRaw) return [];
	try {
		const parsed = JSON.parse(adminRaw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((entry): entry is string => typeof entry === "string")
			.map(normalizeLogin)
			.filter(Boolean);
	} catch {
		return [];
	}
}

function persistAdminLogins(logins: string[]): void {
	const normalized = [...new Set(logins.map(normalizeLogin).filter(Boolean))];
	setHubSetting(ADMIN_SETTING_KEY, JSON.stringify(normalized));
}

export function promoteBootstrapAdminIfNeeded(login: string): boolean {
	const normalized = normalizeLogin(login);
	if (!normalized) return false;

	const existing = getAdminLogins();
	if (existing.length > 0) return false;

	persistAdminLogins([normalized]);
	return true;
}

export function addAdminLogin(login: string): string[] {
	const normalized = normalizeLogin(login);
	if (!normalized) return getAdminLogins();

	const logins = getAdminLogins();
	if (logins.includes(normalized)) return logins;

	persistAdminLogins([...logins, normalized]);
	return getAdminLogins();
}

export function removeAdminLogin(login: string): string[] {
	const normalized = normalizeLogin(login);
	if (!normalized) return getAdminLogins();

	persistAdminLogins(getAdminLogins().filter((entry) => entry !== normalized));
	return getAdminLogins();
}

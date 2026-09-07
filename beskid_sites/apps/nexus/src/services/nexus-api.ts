/**
 * Beskid Nexus catalog, auth, and admin API (same-origin, session cookies).
 */

export interface SetupStatus {
	oauthConfigured: boolean;
	authHubConfigured: boolean;
	authHubUrl: string | null;
	adminConfigured: boolean;
	oauthSource: "hub" | "env" | "file" | "none";
	hasSessionSecret: boolean;
	hasSetupToken: boolean;
}

export interface AuthUser {
	login: string;
	name: string | null;
	avatarUrl: string;
	isAdmin: boolean;
	ownedRepoIds: string[];
}

export interface PublicCatalogEntry {
	id: string;
	displayName: string;
	description: string;
	gitUrl: string;
	defaultBranch?: string;
	sortOrder: number;
	indexed: boolean;
	registryName?: string;
	lastIndexedCommit?: string;
	indexedAt?: string;
	stats?: {
		files?: number;
		nodes?: number;
		edges?: number;
		communities?: number;
		processes?: number;
	};
}

export interface CatalogEntry extends PublicCatalogEntry {
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
}

async function nexusFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(
			(body as { error?: string }).error || res.statusText || `HTTP ${res.status}`,
		);
	}
	return res.json() as Promise<T>;
}

export const fetchSetupStatus = (): Promise<SetupStatus> =>
	nexusFetch<SetupStatus>("/api/admin/setup/status");

export const submitAuthHubSetup = (body: {
	authHubPublicUrl?: string;
	pairingCode: string;
	nexusPublicUrl: string;
	ownerLogin: string;
	adminLogins: string;
	setupToken?: string;
}): Promise<{ ok: boolean }> =>
	nexusFetch("/api/admin/setup", {
		method: "POST",
		body: JSON.stringify(body),
	});

export const fetchAuthMe = (): Promise<AuthUser> =>
	nexusFetch<AuthUser>("/api/auth/me");

export const logout = (): Promise<{ ok: boolean }> =>
	nexusFetch("/api/auth/logout", { method: "POST" });

export const fetchPublicCatalog = (): Promise<PublicCatalogEntry[]> =>
	nexusFetch<PublicCatalogEntry[]>("/api/catalog");

export const fetchAdminCatalog = (): Promise<CatalogEntry[]> =>
	nexusFetch<CatalogEntry[]>("/api/admin/catalog");

export const createCatalogEntry = (body: {
	id?: string;
	displayName: string;
	description: string;
	gitUrl: string;
	defaultBranch?: string;
	enabled?: boolean;
}): Promise<CatalogEntry> =>
	nexusFetch<CatalogEntry>("/api/admin/catalog", {
		method: "POST",
		body: JSON.stringify(body),
	});

export const updateCatalogEntry = (
	id: string,
	body: Partial<{
		displayName: string;
		description: string;
		gitUrl: string;
		defaultBranch: string;
		enabled: boolean;
		sortOrder: number;
	}>,
): Promise<CatalogEntry> =>
	nexusFetch<CatalogEntry>(`/api/admin/catalog/${encodeURIComponent(id)}`, {
		method: "PATCH",
		body: JSON.stringify(body),
	});

export const deleteCatalogEntry = (id: string): Promise<{ ok: boolean }> =>
	nexusFetch(`/api/admin/catalog/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});

export const analyzeCatalogEntry = (
	id: string,
	opts?: { force?: boolean },
): Promise<{
	jobId?: string;
	status?: string;
	skipped?: boolean;
	reason?: string;
}> =>
	nexusFetch(`/api/admin/catalog/${encodeURIComponent(id)}/analyze`, {
		method: "POST",
		body: JSON.stringify(opts ?? {}),
	});

export interface OpenRouterSettings {
	configured: boolean;
	model: string;
	apiKeyMasked: string | null;
}

export const fetchOpenRouterSettings = (): Promise<OpenRouterSettings> =>
	nexusFetch<OpenRouterSettings>("/api/admin/settings/openrouter");

export const updateOpenRouterSettings = (body: {
	apiKey?: string;
}): Promise<OpenRouterSettings> =>
	nexusFetch<OpenRouterSettings>("/api/admin/settings/openrouter", {
		method: "PATCH",
		body: JSON.stringify(body),
	});

export const githubLoginUrl = (): string => "/api/auth/github";

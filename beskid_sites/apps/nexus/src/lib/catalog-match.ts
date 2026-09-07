import type { BackendRepo } from "../services/backend-client";
import type { PublicCatalogEntry } from "../services/nexus-api";

/** Normalize GitHub/Git URLs for catalog ↔ registry matching. */
export function normalizeGitRepoUrl(url: string): string {
	const trimmed = url
		.trim()
		.replace(/\/$/, "")
		.replace(/\.git$/i, "");
	try {
		const u = new URL(
			trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
		);
		return `${u.protocol}//${u.host}${u.pathname}`.toLowerCase();
	} catch {
		return trimmed.toLowerCase();
	}
}

function repoNameFromGitUrl(url: string): string | null {
	try {
		const normalized = normalizeGitRepoUrl(url);
		const segments = new URL(normalized).pathname.split("/").filter(Boolean);
		return segments[segments.length - 1] ?? null;
	} catch {
		return null;
	}
}

/** Client-side fallback when catalog API has not yet linked registry names. */
export function enrichCatalogEntry(
	entry: PublicCatalogEntry,
	repos: BackendRepo[],
): PublicCatalogEntry {
	if (entry.indexed && entry.registryName) return entry;

	const repoByName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
	const repoByUrl = new Map<string, BackendRepo>();
	for (const repo of repos) {
		if (repo.remoteUrl) {
			repoByUrl.set(normalizeGitRepoUrl(repo.remoteUrl), repo);
		}
	}

	const regName = (entry.registryName ?? entry.id).toLowerCase();
	let match = repoByName.get(regName);
	if (!match) {
		match = repoByUrl.get(normalizeGitRepoUrl(entry.gitUrl));
	}
	if (!match) {
		const urlName = repoNameFromGitUrl(entry.gitUrl);
		if (urlName) match = repoByName.get(urlName.toLowerCase());
	}

	if (!match) return entry;

	return {
		...entry,
		indexed: true,
		registryName: match.name,
		indexedAt: entry.indexedAt ?? match.indexedAt,
		lastIndexedCommit: entry.lastIndexedCommit ?? match.lastCommit,
		stats: entry.stats ?? match.stats,
	};
}

/** Indexed repos not represented in the catalog list. */
export function indexedReposOutsideCatalog(
	entries: PublicCatalogEntry[],
	repos: BackendRepo[],
): BackendRepo[] {
	const linkedNames = new Set(
		entries
			.map((e) => enrichCatalogEntry(e, repos).registryName?.toLowerCase())
			.filter(Boolean),
	);
	return repos.filter((r) => !linkedNames.has(r.name.toLowerCase()));
}

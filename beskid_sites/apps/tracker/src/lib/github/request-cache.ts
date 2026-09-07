import { isGitHubRateLimitError } from "#/lib/github/github-errors";

type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function readCache<T>(key: string): T | undefined {
	const entry = store.get(key) as CacheEntry<T> | undefined;
	if (!entry) return undefined;
	if (entry.expiresAt <= Date.now()) {
		store.delete(key);
		return undefined;
	}
	return entry.value;
}

export function readStaleCache<T>(key: string): T | undefined {
	const entry = store.get(key) as CacheEntry<T> | undefined;
	return entry?.value;
}

export function writeCache<T>(key: string, value: T, ttlMs: number): void {
	store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function withTtlCache<T>(
	key: string,
	ttlMs: number,
	fetcher: () => Promise<T>,
	options?: { allowStaleOnRateLimit?: boolean },
): Promise<T> {
	const fresh = readCache<T>(key);
	if (fresh !== undefined) return fresh;

	try {
		const value = await fetcher();
		writeCache(key, value, ttlMs);
		return value;
	} catch (error) {
		if (options?.allowStaleOnRateLimit && isGitHubRateLimitError(error)) {
			const stale = readStaleCache<T>(key);
			if (stale !== undefined) return stale;
		}
		throw error;
	}
}

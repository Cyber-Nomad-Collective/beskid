import { useCallback, useEffect, useRef, useState } from "react";

import {
	fetchPublicCatalog,
	type PublicCatalogEntry,
} from "../services/nexus-api";

export function pickInitialCatalogEntry(
	entries: PublicCatalogEntry[],
	repoParam: string | null,
): PublicCatalogEntry | null {
	const indexed = [...entries]
		.filter((entry) => entry.indexed)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	if (repoParam) {
		const match = entries.find(
			(entry) => entry.id === repoParam || entry.registryName === repoParam,
		);
		if (match?.indexed) return match;
	}

	return indexed[0] ?? null;
}

export interface UseCatalogBootstrapOptions {
	enabled?: boolean;
	onSelectRepo: (registryName: string, entry: PublicCatalogEntry) => void;
}

export function useCatalogBootstrap({
	enabled = true,
	onSelectRepo,
}: UseCatalogBootstrapOptions) {
	const [catalog, setCatalog] = useState<PublicCatalogEntry[]>([]);
	const [activeEntry, setActiveEntry] = useState<PublicCatalogEntry | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const bootstrapped = useRef(false);

	const selectRepo = useCallback(
		(entry: PublicCatalogEntry) => {
			if (!entry.indexed) return;
			const registryName = entry.registryName ?? entry.id;
			setActiveEntry(entry);

			const url = new URL(window.location.href);
			url.searchParams.set("repo", entry.id);
			url.searchParams.delete("project");
			window.history.replaceState(null, "", url.toString());

			onSelectRepo(registryName, entry);
		},
		[onSelectRepo],
	);

	useEffect(() => {
		if (!enabled || bootstrapped.current) return;
		bootstrapped.current = true;

		let cancelled = false;

		void (async () => {
			try {
				const entries = await fetchPublicCatalog();
				if (cancelled) return;

				setCatalog(entries);

				const params = new URLSearchParams(window.location.search);
				const repoParam = params.get("repo") ?? params.get("project");
				const initial = pickInitialCatalogEntry(entries, repoParam);
				setActiveEntry(initial);

				if (initial) {
					onSelectRepo(initial.registryName ?? initial.id, initial);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Failed to load catalog");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [enabled, onSelectRepo]);

	return { catalog, activeEntry, loading, error, selectRepo };
}

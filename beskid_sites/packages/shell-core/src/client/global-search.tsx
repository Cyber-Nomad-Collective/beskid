"use client";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@cyber-nomad-collective/beskid-ui-react/ui/command";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/dialog";
import { Kbd } from "@cyber-nomad-collective/beskid-ui-react/ui/kbd";
import { Clock, CornerDownLeft, Search } from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

/**
 * A single search result returned by an app's {@link GlobalSearchProps.searchFn}.
 */
export interface SearchResult {
	id: string;
	title: string;
	subtitle?: string;
	/** Absolute or relative URL the result navigates to. */
	url: string;
	/** Optional lucide icon name or short glyph rendered before the title. */
	icon?: string;
	/** Optional grouping label; results with the same category render together. */
	category?: string;
}

export interface GlobalSearchProps {
	/** App-provided search implementation. Returns results for a free-text query. */
	searchFn: (query: string) => Promise<SearchResult[]>;
	/** Input placeholder. Defaults to "Search…". */
	placeholder?: string;
	/**
	 * localStorage key for recent searches. Defaults to `beskid:recent-searches`.
	 * Apps can namespace per-app (e.g. `tracker:recent-searches`).
	 */
	storageKey?: string;
	/** Maximum recent searches kept. Defaults to 8. */
	maxRecent?: number;
	/** Optional trigger label. Defaults to "Search". */
	triggerLabel?: string;
	/** Optional extra className on the trigger button. */
	triggerClassName?: string;
	/**
	 * Navigate to a result URL. Defaults to `window.location.assign(url)`.
	 * TanStack Start apps can pass a router-based navigator.
	 */
	navigate?: (url: string) => void;
	/** Debounce window for the search call, in ms. Defaults to 150. */
	debounceMs?: number;
}

interface RecentEntry {
	id: string;
	title: string;
	url: string;
	category?: string;
}

const DEFAULT_STORAGE_KEY = "beskid:recent-searches";
const DEFAULT_MAX_RECENT = 8;
const DEFAULT_DEBOUNCE_MS = 150;

function isMac(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

function readRecent(storageKey: string, maxRecent: number): RecentEntry[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(storageKey);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(e): e is RecentEntry =>
					!!e &&
					typeof e === "object" &&
					typeof (e as RecentEntry).id === "string" &&
					typeof (e as RecentEntry).title === "string" &&
					typeof (e as RecentEntry).url === "string",
			)
			.slice(0, maxRecent);
	} catch {
		return [];
	}
}

function writeRecent(storageKey: string, entries: RecentEntry[]): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(storageKey, JSON.stringify(entries));
	} catch {
		// Quota / privacy mode — ignore.
	}
}

function pushRecent(
	storageKey: string,
	maxRecent: number,
	entry: RecentEntry,
): RecentEntry[] {
	const current = readRecent(storageKey, maxRecent);
	const next = [entry, ...current.filter((e) => e.id !== entry.id)].slice(
		0,
		maxRecent,
	);
	writeRecent(storageKey, next);
	return next;
}

/**
 * Global searchbar for the Beskid site topbar.
 *
 * Renders a compact trigger button with a ⌘K / Ctrl+K hint. The trigger opens
 * a cmdk-backed command palette dialog that calls the app-provided
 * `searchFn` and groups results by `category`. Recent selections are
 * persisted to localStorage and shown when the palette opens with an empty
 * query. Apps that do not pass a `searchFn` simply do not render the
 * searchbar (the component is opt-in).
 */
export function GlobalSearch({
	searchFn,
	placeholder = "Search…",
	storageKey = DEFAULT_STORAGE_KEY,
	maxRecent = DEFAULT_MAX_RECENT,
	triggerLabel = "Search",
	triggerClassName,
	navigate,
	debounceMs = DEFAULT_DEBOUNCE_MS,
}: GlobalSearchProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [recent, setRecent] = useState<RecentEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestIdRef = useRef(0);

	const go = useCallback(
		(url: string) => {
			if (navigate) {
				navigate(url);
			} else if (typeof window !== "undefined") {
				window.location.assign(url);
			}
		},
		[navigate],
	);

	// Global Cmd/Ctrl+K toggle.
	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((prev) => !prev);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	// Load recent searches when the palette opens.
	useEffect(() => {
		if (open) {
			setRecent(readRecent(storageKey, maxRecent));
			setQuery("");
			setResults([]);
		}
	}, [open, storageKey, maxRecent]);

	// Debounced search.
	useEffect(() => {
		if (!open) return;
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		const trimmed = query.trim();
		if (!trimmed) {
			setResults([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		debounceRef.current = setTimeout(async () => {
			const reqId = ++requestIdRef.current;
			try {
				const res = await searchFn(trimmed);
				// Drop stale responses (older request resolved after a newer one).
				if (reqId === requestIdRef.current) {
					setResults(res);
				}
			} catch {
				if (reqId === requestIdRef.current) {
					setResults([]);
				}
			} finally {
				if (reqId === requestIdRef.current) {
					setLoading(false);
				}
			}
		}, debounceMs);
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [query, open, searchFn, debounceMs]);

	const grouped = useMemo(() => {
		const map = new Map<string, SearchResult[]>();
		for (const r of results) {
			const key = r.category ?? "Results";
			const list = map.get(key);
			if (list) {
				list.push(r);
			} else {
				map.set(key, [r]);
			}
		}
		return Array.from(map.entries());
	}, [results]);

	const handleSelect = useCallback(
		(result: SearchResult | RecentEntry) => {
			setRecent(
				pushRecent(storageKey, maxRecent, {
					id: result.id,
					title: result.title,
					url: result.url,
					category: result.category,
				}),
			);
			setOpen(false);
			go(result.url);
		},
		[storageKey, maxRecent, go],
	);

	const shortcut = isMac() ? "⌘" : "Ctrl";

	return (
		<>
			<button
				type="button"
				className={
					triggerClassName ??
					"inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
				}
				aria-label="Open search"
				onClick={() => setOpen(true)}
			>
				<Search className="size-4 shrink-0" />
				<span className="hidden sm:inline">{triggerLabel}</span>
				<Kbd className="ml-1 hidden sm:inline-flex" aria-hidden="true">
					{shortcut}K
				</Kbd>
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className="top-1/4 overflow-hidden rounded-2xl p-0"
					showCloseButton={false}
				>
					<TitleSrOnly>Global search</TitleSrOnly>
					<Command shouldFilter={false} className="rounded-none bg-transparent p-0">
						<CommandInput
							placeholder={placeholder}
							value={query}
							onValueChange={setQuery}
						/>
						<CommandList>
							{loading ? (
								<CommandEmpty>Searching…</CommandEmpty>
							) : query.trim() === "" ? (
								recent.length === 0 ? (
									<CommandEmpty>Start typing to search across Beskid.</CommandEmpty>
								) : (
									<CommandGroup heading="Recent">
										{recent.map((entry) => (
											<CommandItem
												key={`recent-${entry.id}`}
												value={`${entry.title} ${entry.url}`}
												onSelect={() => handleSelect(entry)}
											>
												<Clock className="size-4 shrink-0 opacity-60" />
												<div className="flex min-w-0 flex-1 flex-col">
													<span className="truncate text-sm">{entry.title}</span>
												</div>
												<CornerDownLeft className="ml-auto size-3.5 opacity-40" />
											</CommandItem>
										))}
									</CommandGroup>
								)
							) : grouped.length === 0 ? (
								<CommandEmpty>No results found.</CommandEmpty>
							) : (
								grouped.map(([category, items], idx) => (
									<div key={category}>
										{idx > 0 ? <CommandSeparator /> : null}
										<CommandGroup heading={category}>
											{items.map((result) => (
												<CommandItem
													key={result.id}
													value={`${result.title} ${result.subtitle ?? ""} ${result.url}`}
													onSelect={() => handleSelect(result)}
												>
													{result.icon ? (
														<span className="size-4 shrink-0 text-muted-foreground">
															{result.icon}
														</span>
													) : (
														<Search className="size-4 shrink-0 opacity-60" />
													)}
													<div className="flex min-w-0 flex-1 flex-col">
														<span className="truncate text-sm">{result.title}</span>
														{result.subtitle ? (
															<span className="truncate text-xs text-muted-foreground">
																{result.subtitle}
															</span>
														) : null}
													</div>
													<CornerDownLeft className="ml-auto size-3.5 opacity-40" />
												</CommandItem>
											))}
										</CommandGroup>
									</div>
								))
							)}
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>
		</>
	);
}

function TitleSrOnly({ children }: { children: ReactNode }) {
	return <DialogTitle className="sr-only">{children}</DialogTitle>;
}

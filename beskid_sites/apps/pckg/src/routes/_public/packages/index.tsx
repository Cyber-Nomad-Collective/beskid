import { cn, Input, Skeleton } from "@cyber-nomad-collective/beskid-ui-react";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PackageList } from "#/components/package-list";
import { pckgApi } from "#/lib/api";
import {
	filterPackages,
	KIND_FILTERS,
	kindCounts,
	PACKAGE_SORTS,
	parseKindFilter,
	parsePackageSort,
} from "#/lib/package-filters";

export const Route = createFileRoute("/_public/packages/")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
		kind: parseKindFilter(search.kind),
		sort: parsePackageSort(search.sort),
	}),
	component: PackagesPage,
});

function PackagesPage() {
	const { q, kind, sort } = useSearch({ from: "/_public/packages/" });
	const navigate = useNavigate({ from: "/packages/" });
	const [query, setQuery] = useState(q);
	// The registry is small enough to filter in the browser as you type.
	const packages = useQuery({
		queryKey: ["packages", "all"],
		queryFn: () => pckgApi.listPackages(),
	});

	useEffect(() => setQuery(q), [q]);
	useEffect(() => {
		if (query === q) return;
		const timer = setTimeout(
			() => navigate({ search: (prev) => ({ ...prev, q: query }), replace: true }),
			200,
		);
		return () => clearTimeout(timer);
	}, [query, q, navigate]);

	const items = packages.data ?? [];
	const counts = useMemo(() => kindCounts(items, query), [items, query]);
	const visible = useMemo(
		() => filterPackages(items, { query, kind, sort }),
		[items, query, kind, sort],
	);

	if (packages.isError) throw packages.error;

	return (
		<section className="mx-auto max-w-5xl px-5 py-10">
			<header>
				<h1 className="text-3xl font-bold">Packages</h1>
				<p className="mt-2 text-muted-foreground">
					Libraries, project templates and tools for Beskid, each verified on
					publish.
				</p>
			</header>

			<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search by name, description or tag"
						aria-label="Search packages"
						className="pl-9"
					/>
				</div>
				<label className="flex items-center gap-2 text-sm text-muted-foreground">
					Sort
					<select
						value={sort}
						onChange={(event) =>
							navigate({
								search: (prev) => ({
									...prev,
									sort: parsePackageSort(event.target.value),
								}),
								replace: true,
							})
						}
						className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
					>
						{PACKAGE_SORTS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
			</div>

			<nav aria-label="Package kind" className="mt-4 flex flex-wrap gap-2">
				{KIND_FILTERS.filter(
					(filter) =>
						filter.value === "all" ||
						counts[filter.value] > 0 ||
						filter.value === kind,
				).map((filter) => (
					<button
						key={filter.value}
						type="button"
						aria-pressed={filter.value === kind}
						onClick={() =>
							navigate({
								search: (prev) => ({ ...prev, kind: filter.value }),
								replace: true,
							})
						}
						className={cn(
							"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors",
							filter.value === kind
								? "border-primary bg-primary text-primary-foreground"
								: "border-border text-muted-foreground hover:border-primary hover:text-primary",
						)}
					>
						{filter.label}
						<span
							className={cn(
								"rounded-full px-1.5 text-xs tabular-nums",
								filter.value === kind ? "bg-primary-foreground/20" : "bg-muted",
							)}
						>
							{packages.isPending ? "–" : counts[filter.value]}
						</span>
					</button>
				))}
			</nav>

			<div className="mt-5">
				{packages.isPending ? (
					<div className="space-y-2">
						{[0, 1, 2, 3].map((row) => (
							<Skeleton key={row} className="h-24 w-full" />
						))}
					</div>
				) : (
					<>
						<p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
							{visible.length === 1 ? "1 package" : `${visible.length} packages`}
							{query.trim() ? ` matching “${query.trim()}”` : ""}
						</p>
						<PackageList
							items={visible}
							onTagSelect={(tag) => setQuery(tag)}
							emptyMessage={
								query.trim()
									? `No packages match “${query.trim()}”.`
									: "No packages of this kind yet."
							}
						/>
					</>
				)}
			</div>
		</section>
	);
}

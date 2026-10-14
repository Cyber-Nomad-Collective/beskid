import {
	Badge,
	buttonVariants,
	cn,
} from "@cyber-nomad-collective/beskid-ui-react";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
	useSearch,
} from "@tanstack/react-router";
import { ApiReference } from "#/components/docs/api-reference";
import { Markdown } from "#/components/markdown";
import { pckgApi } from "#/lib/api";
import { itemSelector } from "#/lib/api-docs";
import { packageKindPresentation } from "#/lib/package-kind-presentation";
import type { ApiDocItem } from "#/lib/pckg-api";
import { searchString } from "#/lib/search-params";

type DocsTab = "api" | "readme" | "guides";

/**
 * `/docs/$package?version=&tab=&item=&doc=`
 *
 * - `api`    — the generated API reference (`.beskid/docs/api.json`), rendered
 *              as namespace tree + per-item pages + outline.
 * - `readme` — the README of the release.
 * - `guides` — Markdown files the publisher shipped under `docs/`.
 */
export const Route = createFileRoute("/_public/docs/$package")({
	validateSearch: (search: Record<string, unknown>) => ({
		version: searchString(search.version),
		tab:
			search.tab === "readme" || search.tab === "guides"
				? (search.tab as DocsTab)
				: ("api" as DocsTab),
		item: searchString(search.item),
		doc: searchString(search.doc),
	}),
	component: PackageDocumentationPage,
});

function PackageDocumentationPage() {
	const { package: packageName } = useParams({ from: "/_public/docs/$package" });
	const search = useSearch({ from: "/_public/docs/$package" });
	const navigate = useNavigate();

	const details = useQuery({
		queryKey: ["package", packageName],
		queryFn: () => pckgApi.getPackage(packageName),
	});
	const selectedVersion =
		search.version ||
		details.data?.latestVersion ||
		details.data?.versions.find((item) => !item.isYanked)?.version ||
		"";
	const structured = useQuery({
		queryKey: ["package-structured-docs", packageName, selectedVersion],
		enabled: Boolean(selectedVersion),
		retry: false,
		queryFn: () => pckgApi.getStructuredPackageDocs(packageName, selectedVersion),
	});
	const guides = useQuery({
		queryKey: ["package-docs", packageName, selectedVersion],
		enabled: Boolean(selectedVersion),
		retry: false,
		queryFn: () => pckgApi.listPackageDocs(packageName, selectedVersion),
	});
	const guideFiles = (guides.data ?? []).filter(
		(entry) =>
			entry.path.startsWith("docs/") && entry.path.toLowerCase().endsWith(".md"),
	);
	const selectedDoc = search.doc || guideFiles[0]?.path || "";
	const guide = useQuery({
		queryKey: ["package-doc", packageName, selectedVersion, selectedDoc],
		enabled: Boolean(selectedVersion && selectedDoc && search.tab === "guides"),
		retry: false,
		queryFn: () =>
			pckgApi.getPackageDoc(packageName, selectedVersion, selectedDoc),
	});

	const go = (next: Partial<typeof search>) =>
		void navigate({
			to: "/docs/$package",
			params: { package: packageName },
			search: { ...search, version: selectedVersion, ...next },
		});

	if (details.isPending)
		return (
			<p className="mx-auto max-w-7xl px-5 py-10 text-muted-foreground">
				Loading package documentation…
			</p>
		);
	if (details.isError) throw details.error;
	const presentation = packageKindPresentation({
		kind: details.data.package.packageKind,
		packageName,
		latestVersion: details.data.latestVersion,
		templateShortName: details.data.package.template?.shortName,
	});
	if (!presentation.showDocumentation)
		return (
			<section className="mx-auto max-w-7xl px-5 py-10">
				<h1 className="text-3xl font-bold">{packageName}</h1>
				<p className="mt-3 text-muted-foreground">
					{presentation.badge} releases do not expose structured documentation.
				</p>
			</section>
		);
	if (!selectedVersion)
		return (
			<section className="mx-auto max-w-7xl px-5 py-10">
				<h1 className="text-3xl font-bold">{packageName} documentation</h1>
				<p className="mt-3 text-muted-foreground">
					This package has no browseable release yet.
				</p>
			</section>
		);

	const api = structured.data?.api ?? null;
	const readme = structured.data?.readme ?? null;
	const tabs: Array<{ id: DocsTab; label: string; available: boolean }> = [
		{ id: "api", label: "API reference", available: api !== null },
		{ id: "readme", label: "README", available: readme !== null },
		{
			id: "guides",
			label: `Guides${guideFiles.length ? ` (${guideFiles.length})` : ""}`,
			available: guideFiles.length > 0,
		},
	];
	const sourceHref = (file: string) =>
		`/packages/${encodeURIComponent(packageName)}/files?version=${encodeURIComponent(selectedVersion)}&path=${encodeURIComponent(file)}`;

	return (
		<section className="mx-auto max-w-7xl space-y-6 px-5 py-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-primary">API documentation</p>
					<h1 className="mt-1 text-3xl font-bold">
						<Link
							to="/packages/$name"
							params={{ name: packageName }}
							className="hover:underline"
						>
							{packageName}
						</Link>{" "}
						<span className="text-muted-foreground">{selectedVersion}</span>
					</h1>
					{api && (
						<p className="mt-2 text-sm text-muted-foreground">
							Generated by {api.generator} · api.json schema {api.schemaVersion}
							{api.navigationModel ? ` · ${api.navigationModel}` : ""}
						</p>
					)}
				</div>
				<div className="flex flex-wrap items-end gap-3">
					<Link
						to="/packages/$name/files"
						params={{ name: packageName }}
						search={{ version: selectedVersion, path: "" }}
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						Browse files
					</Link>
					<label className="grid gap-1 text-sm font-medium" htmlFor="doc-version">
						Version
						<select
							id="doc-version"
							className="rounded-md border border-input bg-transparent px-3 py-2"
							value={selectedVersion}
							onChange={(event) =>
								void navigate({
									to: "/docs/$package",
									params: { package: packageName },
									search: {
										version: event.target.value,
										tab: search.tab,
										item: "",
										doc: "",
									},
								})
							}
						>
							{details.data.versions.map((item) => (
								<option key={item.version} value={item.version}>
									{item.version}
									{item.isYanked ? " (yanked)" : ""}
								</option>
							))}
						</select>
					</label>
				</div>
			</header>

			<div
				role="tablist"
				aria-label="Documentation sections"
				className="flex gap-1 border-b border-border"
			>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={search.tab === tab.id}
						disabled={!tab.available}
						className={cn(
							"-mb-px border-b-2 px-3 py-2 text-sm",
							search.tab === tab.id
								? "border-primary font-medium text-primary"
								: "border-transparent text-muted-foreground",
							!tab.available && "cursor-not-allowed opacity-50",
						)}
						onClick={() => go({ tab: tab.id })}
					>
						{tab.label}
					</button>
				))}
			</div>

			{structured.isPending && (
				<p className="text-sm text-muted-foreground">Loading documentation…</p>
			)}
			{structured.isError && (
				<p role="alert" className="text-sm text-destructive">
					Could not load the documentation for this release. Please try again.
				</p>
			)}

			{search.tab === "api" &&
				!structured.isPending &&
				!structured.isError &&
				(api ? (
					<ApiReference
						api={api}
						packageName={packageName}
						version={selectedVersion}
						selector={search.item}
						onSelect={(item: ApiDocItem) =>
							go({ tab: "api", item: itemSelector(item) })
						}
						sourceHref={sourceHref}
					/>
				) : (
					<p className="text-sm text-muted-foreground">
						This release ships no generated API reference. Publish with the library
						profile of <code>beskid pckg pack</code> to include{" "}
						<code>.beskid/docs/api.json</code>.
					</p>
				))}

			{search.tab === "readme" && readme && (
				<Markdown
					source={readme}
					className="max-w-4xl rounded-md border border-border p-6"
				/>
			)}

			{search.tab === "guides" && (
				<div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
					<aside>
						{guides.isError && (
							<p role="alert" className="mb-2 text-sm text-destructive">
								Could not load the guide list. Please try again.
							</p>
						)}
						<ul className="space-y-1">
							{guideFiles.map((entry) => (
								<li key={entry.path}>
									<button
										type="button"
										className={cn(
											"w-full rounded-md px-2 py-1 text-left text-sm",
											selectedDoc === entry.path
												? "bg-primary/10 text-primary"
												: "hover:bg-accent",
										)}
										onClick={() => go({ tab: "guides", doc: entry.path })}
									>
										{entry.path.replace(/^docs\//, "")}
										<Badge variant="outline" className="ml-2 text-[10px]">
											{entry.sizeBytes} B
										</Badge>
									</button>
								</li>
							))}
						</ul>
					</aside>
					<div className="min-w-0 rounded-md border border-border p-6">
						{guide.data ? (
							<Markdown source={guide.data} />
						) : (
							<p className="text-sm text-muted-foreground">
								{guide.isError ? "This guide could not be loaded." : "Loading guide…"}
							</p>
						)}
					</div>
				</div>
			)}
		</section>
	);
}

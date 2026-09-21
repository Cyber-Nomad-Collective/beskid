import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@cyber-nomad-collective/beskid-ui-react";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useParams,
	useSearch,
} from "@tanstack/react-router";
import { useState } from "react";
import { pckgApi } from "#/lib/api";
import { packageKindPresentation } from "#/lib/package-kind-presentation";

export const Route = createFileRoute("/_public/docs/$package")({
	validateSearch: (search: Record<string, unknown>) => ({
		version: typeof search.version === "string" ? search.version : "",
		doc: typeof search.doc === "string" ? search.doc : "",
		source: typeof search.source === "string" ? search.source : "",
	}),
	component: PackageDocumentationPage,
});

function PackageDocumentationPage() {
	const { package: packageName } = useParams({ from: "/_public/docs/$package" });
	const {
		version,
		doc: selectedDoc,
		source: selectedSource,
	} = useSearch({ from: "/_public/docs/$package" });
	const navigate = useNavigate();
	const [docPath, setDocPath] = useState<string | null>(selectedDoc || null);
	const [sourcePath, setSourcePath] = useState<string | null>(
		selectedSource || null,
	);

	const details = useQuery({
		queryKey: ["package", packageName],
		queryFn: () => pckgApi.getPackage(packageName),
	});
	const selectedVersion =
		version ||
		details.data?.latestVersion ||
		details.data?.versions.find((item) => !item.isYanked)?.version ||
		"";
	const readme = useQuery({
		queryKey: ["package-readme", packageName, selectedVersion],
		enabled: Boolean(selectedVersion),
		retry: false,
		queryFn: () => pckgApi.getPackageReadme(packageName, selectedVersion),
	});
	const docs = useQuery({
		queryKey: ["package-docs", packageName, selectedVersion],
		enabled: Boolean(selectedVersion),
		queryFn: () => pckgApi.listPackageDocs(packageName, selectedVersion),
	});
	const source = useQuery({
		queryKey: ["package-source", packageName, selectedVersion],
		enabled: Boolean(selectedVersion),
		queryFn: () => pckgApi.listPackageSource(packageName, selectedVersion),
	});
	const structured = useQuery({
		queryKey: ["package-structured-docs", packageName, selectedVersion],
		enabled: Boolean(selectedVersion),
		queryFn: () => pckgApi.getStructuredPackageDocs(packageName, selectedVersion),
	});
	const doc = useQuery({
		queryKey: ["package-doc", packageName, selectedVersion, docPath],
		enabled: Boolean(selectedVersion && docPath),
		queryFn: () => {
			if (!docPath) {
				throw new Error("docPath is required to load a documentation file");
			}
			return pckgApi.getPackageDoc(packageName, selectedVersion, docPath);
		},
	});
	const sourceFile = useQuery({
		queryKey: ["package-source-file", packageName, selectedVersion, sourcePath],
		enabled: Boolean(selectedVersion && sourcePath),
		queryFn: () =>
			pckgApi.getPackageSource(packageName, selectedVersion, sourcePath as string),
	});

	if (details.isPending)
		return (
			<p className="text-muted-foreground">Loading package documentation…</p>
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
			<section className="mx-auto max-w-6xl px-5 py-10">
				<h1 className="text-3xl font-bold">{packageName}</h1>
				<p className="mt-3 text-muted-foreground">
					{presentation.badge} releases do not expose structured documentation.
				</p>
			</section>
		);
	if (!selectedVersion)
		return (
			<section className="mx-auto max-w-6xl px-5 py-10">
				<h1 className="text-3xl font-bold">{packageName} documentation</h1>
				<p className="mt-3 text-muted-foreground">
					This package has no browseable release yet.
				</p>
			</section>
		);

	const documentation = docs.data ?? [];
	return (
		<section className="mx-auto max-w-6xl space-y-6 px-5 py-10">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-primary">Package artifact</p>
					<h1 className="mt-1 text-3xl font-bold">{packageName} documentation</h1>
					<p className="mt-2 text-muted-foreground">
						Read the files verified in this published release.
					</p>
				</div>
				<label className="grid gap-1 text-sm font-medium" htmlFor="doc-version">
					Version
					<select
						id="doc-version"
						className="rounded-md border border-input bg-transparent px-3 py-2"
						value={selectedVersion}
						onChange={(event) => {
							setDocPath(null);
							setSourcePath(null);
							void navigate({
								to: "/docs/$package",
								params: { package: packageName },
								search: { version: event.target.value, doc: "", source: "" },
							});
						}}
					>
						{details.data.versions.map((item) => (
							<option key={item.version} value={item.version}>
								{item.version}
								{item.isYanked ? " (yanked)" : ""}
							</option>
						))}
					</select>
				</label>
			</header>
			{readme.data && (
				<Card>
					<CardHeader>
						<CardTitle>README</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="overflow-x-auto whitespace-pre-wrap text-sm">
							{readme.data}
						</pre>
					</CardContent>
				</Card>
			)}
			{structured.data?.metadata != null && (
				<Card>
					<CardHeader>
						<CardTitle>Package metadata</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="overflow-x-auto whitespace-pre-wrap text-sm">
							{JSON.stringify(structured.data.metadata, null, 2) as string}
						</pre>
					</CardContent>
				</Card>
			)}
			<Card>
				<CardHeader>
					<CardTitle>Documentation files</CardTitle>
					<CardDescription>
						Markdown files packaged with version {selectedVersion}.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					{documentation.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No documentation files were published.
						</p>
					) : (
						documentation.map((entry) => (
							<Button
								key={entry.path}
								variant="outline"
								className="flex w-full justify-between"
								onClick={() => {
									setDocPath(entry.path);
									void navigate({
										to: "/docs/$package",
										params: { package: packageName },
										search: {
											version: selectedVersion,
											doc: entry.path,
											source: selectedSource,
										},
									});
								}}
							>
								<span>{entry.path}</span>
								<span className="text-muted-foreground">{entry.sizeBytes} B</span>
							</Button>
						))
					)}
					{doc.data && (
						<pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border p-3 text-sm">
							{doc.data}
						</pre>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Source tree</CardTitle>
					<CardDescription>
						Source files from the verified package artifact.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					{(source.data ?? []).length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No source files were published.
						</p>
					) : (
						(source.data ?? []).map((entry) => (
							<Button
								key={entry.path}
								variant="outline"
								className="flex w-full justify-between"
								onClick={() => {
									setSourcePath(entry.path);
									void navigate({
										to: "/docs/$package",
										params: { package: packageName },
										search: {
											version: selectedVersion,
											doc: selectedDoc,
											source: entry.path,
										},
									});
								}}
							>
								{entry.path}
								<span className="text-muted-foreground">{entry.sizeBytes} B</span>
							</Button>
						))
					)}
					{sourceFile.data && (
						<pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border p-3 text-sm">
							{sourceFile.data}
						</pre>
					)}
				</CardContent>
			</Card>
		</section>
	);
}

import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
	useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";
import {
	type FileQueryState,
	PackageFileBrowser,
} from "#/components/files/package-file-browser";
import { PackageFilesSkeleton } from "#/components/loading-skeletons";
import { PckgApiError, pckgApi } from "#/lib/api";
import { defaultFile } from "#/lib/file-tree";
import { searchString } from "#/lib/search-params";

/**
 * `/packages/$name/files?version=&path=` — browse the verified artifact of one
 * release. `version` defaults to the latest non-yanked release; `path`
 * defaults to the README (then the manifest, then the first source file).
 */
export const Route = createFileRoute("/_public/packages/$name_/files")({
	validateSearch: (search: Record<string, unknown>) => ({
		version: searchString(search.version),
		path: searchString(search.path),
	}),
	component: PackageFilesPage,
});

function PackageFilesPage() {
	const { name } = useParams({ from: "/_public/packages/$name_/files" });
	const { version, path } = useSearch({
		from: "/_public/packages/$name_/files",
	});
	const navigate = useNavigate();
	const requestedVersion = version || "latest";

	const details = useQuery({
		queryKey: ["package", name],
		queryFn: () => pckgApi.getPackage(name),
	});
	const listing = useQuery({
		queryKey: ["package-files", name, requestedVersion],
		retry: false,
		queryFn: () => pckgApi.listPackageFiles(name, requestedVersion),
	});
	const resolvedVersion = listing.data?.version ?? (version || null);
	const selectedPath =
		path || (listing.data ? defaultFile(listing.data.entries) : null);
	const file = useQuery({
		queryKey: ["package-file", name, resolvedVersion, selectedPath],
		enabled: Boolean(resolvedVersion && selectedPath),
		retry: false,
		queryFn: () =>
			pckgApi.getPackageFile(
				name,
				resolvedVersion as string,
				selectedPath as string,
			),
	});

	// Pin the URL to the concrete version once `latest` resolves so links are stable.
	useEffect(() => {
		if (listing.data && version !== listing.data.version) {
			void navigate({
				to: "/packages/$name/files",
				params: { name },
				search: { version: listing.data.version, path },
				replace: true,
			});
		}
	}, [listing.data, version, path, name, navigate]);

	if (listing.isPending || details.isPending) return <PackageFilesSkeleton />;
	if (listing.isError) {
		const missing =
			listing.error instanceof PckgApiError && listing.error.status === 404;
		return (
			<section className="mx-auto max-w-6xl px-5 py-10">
				<h1 className="text-3xl font-bold">{name}</h1>
				<p className="mt-3 text-muted-foreground">
					{missing
						? "No browseable artifact exists for this version."
						: "The package files could not be loaded."}
				</p>
			</section>
		);
	}
	if (details.isError) throw details.error;

	const fileState: FileQueryState = file.isPending
		? selectedPath
			? { status: "loading" }
			: { status: "idle" }
		: file.isError
			? { status: "error", message: "This file could not be loaded." }
			: { status: "ready", file: file.data };
	const versions = details.data.versions.filter((item) => !item.isYanked);

	return (
		<section className="mx-auto max-w-7xl space-y-4 px-5 py-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-primary">Package files</p>
					<h1 className="mt-1 text-3xl font-bold">
						<Link to="/packages/$name" params={{ name }} className="hover:underline">
							{name}
						</Link>{" "}
						<span className="text-muted-foreground">{listing.data.version}</span>
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Every file of the verified release artifact, exactly as the registry
						stored it.
					</p>
				</div>
				<label className="grid gap-1 text-sm font-medium" htmlFor="files-version">
					Version
					<select
						id="files-version"
						className="rounded-md border border-input bg-transparent px-3 py-2"
						value={listing.data.version}
						onChange={(event) =>
							void navigate({
								to: "/packages/$name/files",
								params: { name },
								search: { version: event.target.value, path: "" },
							})
						}
					>
						{versions.map((item) => (
							<option key={item.version} value={item.version}>
								{item.version}
							</option>
						))}
					</select>
				</label>
			</header>
			<PackageFileBrowser
				packageName={name}
				version={listing.data.version}
				entries={listing.data.entries}
				selectedPath={selectedPath}
				onSelect={(next) =>
					void navigate({
						to: "/packages/$name/files",
						params: { name },
						search: { version: listing.data.version, path: next },
					})
				}
				file={fileState}
				downloadUrl={pckgApi.packageDownloadUrl(name, listing.data.version)}
			/>
		</section>
	);
}

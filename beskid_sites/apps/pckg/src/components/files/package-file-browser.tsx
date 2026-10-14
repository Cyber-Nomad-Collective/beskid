import {
	Badge,
	buttonVariants,
	FileExplorer,
	type RepoEntry,
} from "@cyber-nomad-collective/beskid-ui-react";
import { useMemo } from "react";
import { CodeView } from "#/components/code-view";
import { Markdown } from "#/components/markdown";
import { buildFileTree, formatBytes } from "#/lib/file-tree";
import { isMarkdownPath, languageForPath } from "#/lib/highlight";
import type { PackageBrowseEntry, PackageFileContent } from "#/lib/pckg-api";

export type FileQueryState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "ready"; file: PackageFileContent };

/**
 * Two-pane artifact browser: the shared `FileExplorer` tree on the left and
 * a viewer on the right. The viewer renders Markdown, highlights Beskid /
 * BSOL / JSON, falls back to plain text and refuses to render binary or
 * oversized entries (the registry never sends their bytes anyway).
 *
 * Presentational: the route owns the queries and the `?path=` search param.
 */
export function PackageFileBrowser({
	packageName,
	version,
	entries,
	selectedPath,
	onSelect,
	file,
	downloadUrl,
}: {
	packageName: string;
	version: string;
	entries: PackageBrowseEntry[];
	selectedPath: string | null;
	onSelect: (path: string) => void;
	file: FileQueryState;
	downloadUrl: string;
}) {
	const tree = useMemo(() => buildFileTree(entries), [entries]);
	const sizeByPath = useMemo(
		() => new Map(entries.map((entry) => [entry.path, entry.sizeBytes])),
		[entries],
	);
	const totalBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);

	return (
		<div className="grid gap-4 lg:grid-cols-[minmax(220px,300px)_1fr]">
			<aside className="rounded-md border border-border">
				<div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
					<span>
						{entries.length} files · {formatBytes(totalBytes)}
					</span>
					<a
						className={buttonVariants({ variant: "ghost", size: "sm" })}
						href={downloadUrl}
					>
						Download .bpk
					</a>
				</div>
				<FileExplorer
					ariaLabel={`Files in ${packageName} ${version}`}
					entries={tree}
					activePath={selectedPath ?? undefined}
					onSelect={(entry: RepoEntry) => {
						if (entry.kind === "file") onSelect(entry.path);
					}}
					className="max-h-[70vh] overflow-auto p-1"
				/>
			</aside>
			<section className="min-w-0 rounded-md border border-border">
				{selectedPath === null ? (
					<p className="p-6 text-sm text-muted-foreground">
						Select a file to view it.
					</p>
				) : (
					<>
						<header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
							<h2 className="truncate font-mono text-sm" title={selectedPath}>
								{selectedPath}
							</h2>
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Badge variant="secondary">{languageForPath(selectedPath)}</Badge>
								<span>{formatBytes(sizeByPath.get(selectedPath) ?? 0)}</span>
							</div>
						</header>
						<FileBody path={selectedPath} state={file} />
					</>
				)}
			</section>
		</div>
	);
}

function FileBody({ path, state }: { path: string; state: FileQueryState }) {
	if (state.status === "idle" || state.status === "loading") {
		return <p className="p-6 text-sm text-muted-foreground">Loading file…</p>;
	}
	if (state.status === "error") {
		return <p className="p-6 text-sm text-destructive">{state.message}</p>;
	}
	const { file } = state;
	if (file.encoding === "binary") {
		return (
			<p className="p-6 text-sm text-muted-foreground">
				Binary file ({formatBytes(file.sizeBytes)}). Download the package to inspect
				it.
			</p>
		);
	}
	if (file.encoding === "too-large" || file.content === null) {
		return (
			<p className="p-6 text-sm text-muted-foreground">
				This file is {formatBytes(file.sizeBytes)}, above the{" "}
				{formatBytes(file.limitBytes ?? 0)} in-browser limit. Download the package
				to read it.
			</p>
		);
	}
	if (isMarkdownPath(path)) {
		return <Markdown source={file.content} className="p-6" />;
	}
	return (
		<CodeView
			source={file.content}
			language={languageForPath(path)}
			className="rounded-none border-0"
		/>
	);
}

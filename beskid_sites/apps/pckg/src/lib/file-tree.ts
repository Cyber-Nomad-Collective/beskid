import type { RepoEntry } from "@cyber-nomad-collective/beskid-ui-react";
import type { PackageBrowseEntry } from "./pckg-api";

/**
 * Builds the nested tree the shared `FileExplorer` renders from the flat,
 * archive-ordered listing the registry returns. Directories sort before
 * files, each group alphabetically, matching every other Beskid explorer.
 */
export function buildFileTree(entries: PackageBrowseEntry[]): RepoEntry[] {
	const root: RepoEntry[] = [];
	const directories = new Map<string, RepoEntry>();
	for (const entry of entries) {
		const segments = entry.path.split("/");
		let siblings = root;
		let prefix = "";
		for (let index = 0; index < segments.length - 1; index += 1) {
			prefix = prefix
				? `${prefix}/${segments[index]}`
				: (segments[index] as string);
			let directory = directories.get(prefix);
			if (!directory) {
				directory = {
					path: prefix,
					kind: "dir",
					name: segments[index],
					children: [],
				};
				directories.set(prefix, directory);
				siblings.push(directory);
			}
			siblings = directory.children as RepoEntry[];
		}
		siblings.push({
			path: entry.path,
			kind: "file",
			name: segments[segments.length - 1],
		});
	}
	sortTree(root);
	return root;
}

function sortTree(entries: RepoEntry[]): void {
	entries.sort((left, right) => {
		if (left.kind !== right.kind) return left.kind === "dir" ? -1 : 1;
		return (left.name ?? left.path).localeCompare(right.name ?? right.path, "en");
	});
	for (const entry of entries) {
		if (entry.children) sortTree(entry.children);
	}
}

/** Paths of every ancestor directory, so the explorer can expand to a file. */
export function ancestorDirectories(path: string): string[] {
	const segments = path.split("/");
	const ancestors: string[] = [];
	for (let index = 1; index < segments.length; index += 1) {
		ancestors.push(segments.slice(0, index).join("/"));
	}
	return ancestors;
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

/** The file a browser opens first: README, then the manifest, then the first source. */
export function defaultFile(entries: PackageBrowseEntry[]): string | null {
	const paths = entries.map((entry) => entry.path);
	return (
		paths.find((path) => path === "README.md") ??
		paths.find((path) => path.endsWith(".bproj")) ??
		paths.find((path) => path.startsWith("src/")) ??
		paths[0] ??
		null
	);
}

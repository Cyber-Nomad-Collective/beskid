import { Button } from "@cyber-nomad-collective/beskid-ui-react";
import type { PackageBrowseEntry } from "#/lib/pckg-api";

export interface PackageBrowseListProps {
	kind: "documentation" | "source";
	isPending: boolean;
	isError: boolean;
	entries: PackageBrowseEntry[] | undefined;
	onSelect: (path: string) => void;
}

export function PackageBrowseList({
	kind,
	isPending,
	isError,
	entries,
	onSelect,
}: PackageBrowseListProps) {
	if (isPending) {
		return <p className="text-sm text-muted-foreground">Loading {kind} files…</p>;
	}
	if (isError) {
		return (
			<p role="alert" className="text-sm text-destructive">
				Could not load {kind} files. Please try again.
			</p>
		);
	}
	if (!entries || entries.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No {kind} files were published.
			</p>
		);
	}
	return entries.map((entry) => (
		<Button
			key={entry.path}
			variant="outline"
			className="flex w-full justify-between"
			onClick={() => onSelect(entry.path)}
		>
			<span>{entry.path}</span>
			<span className="text-muted-foreground">{entry.sizeBytes} B</span>
		</Button>
	));
}

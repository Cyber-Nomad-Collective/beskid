"use client";

import {
	type RepoEntry,
	RepoExplorerDialog,
} from "@cyber-nomad-collective/beskid-ui-react/explorer";
import { sampleRepo } from "@cyber-nomad-collective/beskid-ui-react/graph";
import { FolderOpen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";

export interface RepoPathFieldProps {
	paths: string[];
	onChange: (paths: string[]) => void;
	/** Override fixture tree (defaults to ui-react sampleRepo). */
	entries?: RepoEntry[];
	disabled?: boolean;
}

/**
 * Attach repo-relative paths to task metadata via shared RepoExplorerDialog.
 * Uses the sample fixture tree until a live monorepo listing API exists.
 */
export function RepoPathField({
	paths,
	onChange,
	entries,
	disabled = false,
}: RepoPathFieldProps) {
	const [open, setOpen] = useState(false);
	const tree = useMemo(() => entries ?? [sampleRepo], [entries]);

	const addPath = (entry: RepoEntry) => {
		const path = entry.path.replace(/^\/+/, "");
		if (!path || paths.includes(path)) return;
		onChange([...paths, path]);
	};

	const removeAt = (index: number) => {
		onChange(paths.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<div>
					<Label>Repository paths</Label>
					<p className="text-muted-foreground text-xs">
						Attach repo-relative source paths to this task (fixture browser until live
						listing is wired).
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					onClick={() => setOpen(true)}
				>
					<FolderOpen className="size-3.5" />
					Browse repository…
				</Button>
			</div>

			{paths.length > 0 ? (
				<ul className="space-y-2">
					{paths.map((path, index) => (
						<li
							key={path}
							className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
						>
							<span className="truncate font-mono text-xs">{path}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={disabled}
								onClick={() => removeAt(index)}
								aria-label={`Remove ${path}`}
							>
								<Trash2 className="size-4" />
							</Button>
						</li>
					))}
				</ul>
			) : (
				<p className="text-muted-foreground text-xs">
					No repository paths attached.
				</p>
			)}

			<RepoExplorerDialog
				open={open}
				onOpenChange={setOpen}
				entries={tree}
				title="Browse repository"
				description="Select a file path to attach to this task."
				confirmLabel="Attach path"
				onSelect={addPath}
			/>
		</div>
	);
}

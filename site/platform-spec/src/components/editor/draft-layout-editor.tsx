"use client";

import { useMemo, useState } from "react";
import type { LayoutFile } from "@cyber-nomad-collective/spec-core";
import { layoutFileWithGrid } from "@cyber-nomad-collective/spec-core";
import { SpecLayoutEditor } from "@beskid/ui-react/platform-spec";

export interface DraftLayoutEditorProps {
	layoutJson: string | null;
	onChange: (layoutJson: string) => void;
	disabled?: boolean;
}

export function DraftLayoutEditor({
	layoutJson,
	onChange,
	disabled = false,
}: DraftLayoutEditorProps) {
	const layout = useMemo<LayoutFile>(() => {
		if (layoutJson) {
			try {
				return layoutFileWithGrid(JSON.parse(layoutJson) as LayoutFile);
			} catch {
				// fall through
			}
		}
		return layoutFileWithGrid({
			version: 1,
			level: "article",
			widgets: [],
		});
	}, [layoutJson]);

	const [mode, setMode] = useState<"edit" | "json">("edit");

	if (disabled) {
		return layoutJson ? (
			<pre className="overflow-auto rounded-md border p-3 text-xs">{layoutJson}</pre>
		) : null;
	}

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<button
					type="button"
					className={`rounded-md px-3 py-1 text-sm ${mode === "edit" ? "bg-primary text-primary-foreground" : "border"}`}
					onClick={() => setMode("edit")}
				>
					Visual layout
				</button>
				<button
					type="button"
					className={`rounded-md px-3 py-1 text-sm ${mode === "json" ? "bg-primary text-primary-foreground" : "border"}`}
					onClick={() => setMode("json")}
				>
					JSON
				</button>
			</div>
			{mode === "edit" ? (
				<SpecLayoutEditor
					layout={layout}
					onChange={(next) => onChange(JSON.stringify(next, null, 2))}
				/>
			) : (
				<textarea
					className="min-h-48 w-full rounded-md border px-3 py-2 font-mono text-xs"
					value={layoutJson ?? JSON.stringify(layout, null, 2)}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}
		</div>
	);
}

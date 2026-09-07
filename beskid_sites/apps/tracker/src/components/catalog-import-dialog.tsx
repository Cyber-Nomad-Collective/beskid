"use client";

import { useMutation } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import type { CatalogImportSummary } from "#/lib/tracker/import-catalog";
import { cn } from "#/lib/utils";
import type { ImportPreviewSummary } from "#/server/catalog-import";

interface CatalogImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImport: (
		files: Array<{ relativePath: string; content: string }>,
	) => Promise<CatalogImportSummary>;
	onPreview: (
		files: Array<{ relativePath: string; content: string }>,
	) => Promise<ImportPreviewSummary>;
	onComplete?: () => void;
}

export function CatalogImportDialog({
	open,
	onOpenChange,
	onImport,
	onPreview,
	onComplete,
}: CatalogImportDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [pickedCount, setPickedCount] = useState(0);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [files, setFiles] = useState<
		Array<{ relativePath: string; content: string }>
	>([]);

	const previewMutation = useMutation({
		mutationFn: () => onPreview(files),
		onSuccess: (summary) => {
			setStatusMessage(
				`Preview: ${summary.versions} version(s), ${summary.tasks} task(s), ${summary.workstreams} workstream(s), ${summary.deliverables} deliverable(s).`,
			);
		},
		onError: (error) => {
			setStatusMessage(error instanceof Error ? error.message : "Preview failed");
		},
	});

	const importMutation = useMutation({
		mutationFn: () => onImport(files),
		onSuccess: (summary) => {
			setStatusMessage(
				`Imported ${summary.tasksUpserted} task(s) across ${summary.versionsUpserted} version(s).`,
			);
			onComplete?.();
		},
		onError: (error) => {
			setStatusMessage(error instanceof Error ? error.message : "Import failed");
		},
	});

	useEffect(() => {
		if (!open) {
			setStatusMessage(null);
			setPickedCount(0);
			setFiles([]);
		}
	}, [open]);

	const readDirectory = async (fileList: FileList) => {
		const jsonFiles = [...fileList].filter(
			(f) => f.name.endsWith(".json") && f.size < 512_000,
		);
		if (jsonFiles.length === 0) {
			setStatusMessage("No .json files found in the selected folder.");
			return;
		}

		const loaded: Array<{ relativePath: string; content: string }> = [];
		for (const file of jsonFiles) {
			const relativePath =
				(file as File & { webkitRelativePath?: string }).webkitRelativePath ||
				file.name;
			const content = await file.text();
			loaded.push({ relativePath, content });
		}

		setFiles(loaded);
		setPickedCount(loaded.length);
		setStatusMessage(`Loaded ${loaded.length} JSON file(s).`);
	};

	const busy = previewMutation.isPending || importMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Import catalog to database</DialogTitle>
					<DialogDescription>
						Select a folder like <code className="text-xs">data/</code> with seed
						JSON. Data is written to the tracker SQLite database only.
					</DialogDescription>
				</DialogHeader>

				<input
					ref={inputRef}
					type="file"
					className="sr-only"
					// @ts-expect-error webkitdirectory is supported in Chromium
					webkitdirectory=""
					multiple
					onChange={(e) => {
						if (e.target.files?.length) void readDirectory(e.target.files);
						e.target.value = "";
					}}
				/>

				<Button
					type="button"
					variant="outline"
					className="w-full justify-start"
					disabled={busy}
					onClick={() => inputRef.current?.click()}
				>
					<FolderOpen className="size-4" />
					Choose folder…
				</Button>

				{pickedCount > 0 ? (
					<p className="text-muted-foreground text-sm">
						{pickedCount} JSON files ready.
					</p>
				) : null}

				{statusMessage ? (
					<output
						className={cn(
							"text-sm leading-relaxed",
							(previewMutation.isError || importMutation.isError) &&
								"text-destructive",
						)}
					>
						{statusMessage}
					</output>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={busy}
					>
						Close
					</Button>
					<Button
						type="button"
						variant="secondary"
						disabled={files.length === 0 || busy}
						onClick={() => previewMutation.mutate()}
					>
						{previewMutation.isPending ? "Previewing…" : "Preview"}
					</Button>
					<Button
						type="button"
						disabled={files.length === 0 || busy}
						onClick={() => importMutation.mutate()}
					>
						{importMutation.isPending ? "Importing…" : "Import to DB"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { FileIcon, Paperclip, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { ReportFieldChrome } from "#/components/report-fields/report-field-chrome";
import { Button } from "#/components/ui/button";
import {
	formatFileSize,
	type ReportAttachmentDraft,
} from "#/lib/report-issue/field-values";
import { cn } from "#/lib/utils";

const MAX_FILES = 8;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

interface AttachmentsFieldProps {
	id: string;
	label: string;
	hint?: string;
	files: ReportAttachmentDraft[];
	onChange: (files: ReportAttachmentDraft[]) => void;
	disabled?: boolean;
}

export function AttachmentsField({
	label,
	hint,
	files,
	onChange,
	disabled,
}: AttachmentsFieldProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragOver, setDragOver] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addFiles = (incoming: FileList | File[]) => {
		const list = Array.from(incoming);
		const next = [...files];
		for (const file of list) {
			if (next.length >= MAX_FILES) {
				setError(`Maximum ${MAX_FILES} files.`);
				break;
			}
			if (file.size > MAX_FILE_BYTES) {
				setError(`${file.name} exceeds ${formatFileSize(MAX_FILE_BYTES)}.`);
				continue;
			}
			next.push({
				id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
				file,
			});
		}
		setError(null);
		onChange(next);
	};

	const remove = (attachmentId: string) => {
		onChange(files.filter((f) => f.id !== attachmentId));
	};

	return (
		<ReportFieldChrome
			id={inputId}
			label={label}
			hint={hint ?? "Images, logs, or recordings (max 2 MB each)."}
			className="work-item-attachments"
		>
			<input
				ref={inputRef}
				id={inputId}
				type="file"
				className="sr-only"
				multiple
				disabled={disabled}
				onChange={(e) => {
					if (e.target.files) addFiles(e.target.files);
					e.target.value = "";
				}}
			/>

			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragOver(false);
					if (!disabled && e.dataTransfer.files.length) {
						addFiles(e.dataTransfer.files);
					}
				}}
				className={cn(
					"work-item-attachments__dropzone flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
					dragOver
						? "border-primary bg-primary/5"
						: "border-border/80 bg-muted/15 hover:bg-muted/25",
					disabled && "pointer-events-none opacity-50",
				)}
			>
				<Paperclip className="text-muted-foreground mb-2 size-5" />
				<p className="text-sm font-medium">Drop files here or browse</p>
				<p className="text-muted-foreground mt-1 text-xs">
					{files.length}/{MAX_FILES} files
				</p>
			</button>

			{error ? (
				<p className="text-destructive mt-2 text-xs" role="alert">
					{error}
				</p>
			) : null}

			{files.length > 0 ? (
				<ul className="mt-3 space-y-1.5">
					{files.map((item) => (
						<li
							key={item.id}
							className="bg-background flex items-center gap-2 rounded-md border border-border/70 px-2.5 py-1.5 text-sm"
						>
							<FileIcon className="text-muted-foreground size-4 shrink-0" />
							<span className="min-w-0 flex-1 truncate font-medium">
								{item.file.name}
							</span>
							<span className="text-muted-foreground shrink-0 text-xs">
								{formatFileSize(item.file.size)}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="size-7 shrink-0"
								disabled={disabled}
								aria-label={`Remove ${item.file.name}`}
								onClick={(e) => {
									e.stopPropagation();
									remove(item.id);
								}}
							>
								<X className="size-3.5" />
							</Button>
						</li>
					))}
				</ul>
			) : null}
		</ReportFieldChrome>
	);
}

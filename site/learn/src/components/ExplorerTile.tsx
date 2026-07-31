import { File, FileCode, FolderOpen } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { LearnExercise } from "#/data/learningCatalog";

export interface VirtualFile {
	name: string;
	content: string;
	language?: string;
}

interface ExplorerTileProps {
	exercise: LearnExercise;
	onFileSelect: (file: VirtualFile) => void;
}

export function ExplorerTile({ exercise, onFileSelect }: ExplorerTileProps) {
	const files = useMemo<VirtualFile[]>(
		() => [
			{
				name: "start.bd",
				content: exercise.starterCode,
				language: "beskid",
			},
		],
		[exercise.starterCode],
	);

	const handleFileClick = useCallback(
		(file: VirtualFile) => {
			onFileSelect(file);
		},
		[onFileSelect],
	);

	return (
		<div className="explorer-tile">
			<div className="explorer-header">
				<FolderOpen className="w-3.5 h-3.5 text-primary" />
				<span className="text-xs font-semibold">Files</span>
			</div>
			<div className="explorer-file-list">
				{files.map((file) => (
					<button
						type="button"
						key={file.name}
						className="explorer-file-item"
						onClick={() => handleFileClick(file)}
						title={`Open ${file.name}`}
					>
						{file.language === "beskid" ? (
							<FileCode className="w-3.5 h-3.5 text-primary shrink-0" />
						) : (
							<File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
						)}
						<span className="explorer-file-name">{file.name}</span>
					</button>
				))}
			</div>
			<div className="explorer-footer">
				<p className="text-muted-foreground text-xs px-2">
					{files.length} file{files.length !== 1 ? "s" : ""}
				</p>
			</div>
		</div>
	);
}

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@beskid/ui-react";
import { Editor } from "@monaco-editor/react";
import { AlertCircle, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { LearnExercise } from "#/data/learningCatalog";

interface LessonEditorProps {
	lesson: LearnExercise;
	canEdit: boolean;
	onSaved: (lesson: LearnExercise) => void;
}

type DirtyState = {
	title: string;
	objective: string;
	difficulty: string;
	command: string;
	detailedContent: string;
	hints: string[];
};

function fromLesson(lesson: LearnExercise): DirtyState {
	return {
		title: lesson.title,
		objective: lesson.objective,
		difficulty: lesson.difficulty,
		command: lesson.command,
		detailedContent: lesson.detailedContent ?? "",
		hints: [...(lesson.hints ?? [])],
	};
}

export function LessonEditor({ lesson, canEdit, onSaved }: LessonEditorProps) {
	const [draft, setDraft] = useState<DirtyState>(() => fromLesson(lesson));
	const [showPreview, setShowPreview] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateField = useCallback(
		<K extends keyof DirtyState>(key: K, value: DirtyState[K]) => {
			setDraft((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	const dirty = useMemo(() => {
		const orig = fromLesson(lesson);
		if (orig.title !== draft.title) return true;
		if (orig.objective !== draft.objective) return true;
		if (orig.difficulty !== draft.difficulty) return true;
		if (orig.command !== draft.command) return true;
		if (orig.detailedContent !== draft.detailedContent) return true;
		if (JSON.stringify(orig.hints) !== JSON.stringify(draft.hints)) return true;
		return false;
	}, [lesson, draft]);

	const addHint = useCallback(() => {
		setDraft((prev) => ({ ...prev, hints: [...prev.hints, ""] }));
	}, []);

	const removeHint = useCallback((index: number) => {
		setDraft((prev) => ({
			...prev,
			hints: prev.hints.filter((_, i) => i !== index),
		}));
	}, []);

	const updateHint = useCallback((index: number, value: string) => {
		setDraft((prev) => ({
			...prev,
			hints: prev.hints.map((h, i) => (i === index ? value : h)),
		}));
	}, []);

	const handleSave = async () => {
		if (!canEdit) return;
		setSaving(true);
		setError(null);
		try {
			const payload = { ...lesson, ...draft, hints: draft.hints.filter(Boolean) };
			const res = await fetch("/api/lessons/" + encodeURIComponent(lesson.id), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Save failed: " + res.statusText);
			const updated = (await res.json()) as LearnExercise;
			onSaved(updated);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Save failed");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card className="lesson-editor">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle>Edit Lesson</CardTitle>
						<Badge variant="outline">{lesson.id}</Badge>
						{dirty && (
							<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
								Unsaved
							</Badge>
						)}
						{!canEdit && <Badge variant="secondary">Read-only</Badge>}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowPreview((p) => !p)}
							disabled={!canEdit}
						>
							{showPreview ? (
								<EyeOff className="size-4 mr-1" />
							) : (
								<Eye className="size-4 mr-1" />
							)}
							{showPreview ? "Edit" : "Preview"}
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={!canEdit || !dirty || saving}
						>
							<Save className="size-4 mr-1" />
							{saving ? "Saving..." : "Save"}
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{error && (
					<div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
						<AlertCircle className="size-4 shrink-0" />
						<span>{error}</span>
						<Button
							variant="ghost"
							size="xs"
							className="ml-auto"
							onClick={() => setError(null)}
						>
							Dismiss
						</Button>
					</div>
				)}

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label htmlFor="le-title">Title</Label>
						<Input
							id="le-title"
							value={draft.title}
							onChange={(e) => updateField("title", e.target.value)}
							disabled={!canEdit}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="le-difficulty">Difficulty</Label>
						<select
							id="le-difficulty"
							className="flex h-9 w-full rounded-md border border-input bg-input/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							value={draft.difficulty}
							onChange={(e) => updateField("difficulty", e.target.value)}
							disabled={!canEdit}
						>
							<option value="beginner">Beginner</option>
							<option value="intermediate">Intermediate</option>
							<option value="advanced">Advanced</option>
						</select>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="le-objective">Objective</Label>
					<Input
						id="le-objective"
						value={draft.objective}
						onChange={(e) => updateField("objective", e.target.value)}
						disabled={!canEdit}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="le-command">Command</Label>
					<Input
						id="le-command"
						value={draft.command}
						onChange={(e) => updateField("command", e.target.value)}
						disabled={!canEdit}
					/>
				</div>

				<div className="space-y-1.5">
					<Label>Hints</Label>
					<div className="space-y-2">
						{draft.hints.map((hint, i) => (
							<div key={i} className="flex items-center gap-2">
								<Input
									value={hint}
									onChange={(e) => updateHint(i, e.target.value)}
									placeholder="Hint text..."
									disabled={!canEdit}
									className="flex-1"
								/>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => removeHint(i)}
									disabled={!canEdit}
									aria-label="Remove hint"
								>
									<Trash2 className="size-3.5" />
								</Button>
							</div>
						))}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={addHint}
						disabled={!canEdit}
						className="mt-1"
					>
						<Plus className="size-3.5 mr-1" /> Add Hint
					</Button>
				</div>

				<div className="space-y-1.5">
					<Label>Content (Markdown)</Label>
					{showPreview ? (
						<div
							className="min-h-[320px] rounded-md border border-input bg-card p-4 whitespace-pre-wrap text-sm text-card-foreground"
							dangerouslySetInnerHTML={{
								__html: draft.detailedContent.replace(/\n/g, "<br/>"),
							}}
						/>
					) : (
						<Editor
							height="320px"
							defaultLanguage="markdown"
							theme="vs-dark"
							value={draft.detailedContent}
							onChange={(value) => updateField("detailedContent", value ?? "")}
							options={{
								readOnly: !canEdit,
								minimap: { enabled: false },
								fontFamily:
									"JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
								fontSize: 14,
								tabSize: 2,
							}}
						/>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

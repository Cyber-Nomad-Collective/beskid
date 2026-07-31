import { Badge, Button, Card } from "@beskid/ui-react";
import { Editor } from "@monaco-editor/react";
import { FitAddon } from "@xterm/addon-fit";
import { clsx } from "clsx";
import {
	BookOpen,
	CheckCircle,
	Lightbulb,
	Play,
	RotateCcw,
	TerminalIcon,
} from "lucide-react";
import type * as monacoEditor from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "xterm";
import { CodeHighlight } from "#/components/CodeHighlight";
import { ExplorerTile } from "#/components/ExplorerTile";
import { LessonContent } from "#/components/LessonContent";
import { LessonEditor } from "#/components/LessonEditor";
import { ResizableTileGrid } from "#/components/ResizableTileGrid";
import { WorkspaceTabs, type TileTab } from "#/components/WorkspaceTabs";
import type { LearnExercise } from "#/data/learningCatalog";
import { validateModeForExercise } from "#/data/learningCatalog";

// ── Types ──────────────────────────────────────────────────────────────────────

type CheckResponse = {
	exerciseId: string;
	command: string;
	exitCode: number;
	success: boolean;
	stdout: string;
	stderr: string;
	timedOut: boolean;
	durationMs: number;
	diagnosticsSummary: string;
	expectedOutputMatched?: boolean;
	expectedOutput?: string;
	error?: string;
};

interface TileConfig {
	id: string;
	label: string;
	defaultVisible: boolean;
	defaultSize: number; // percentage
}

interface PersistedLayout {
	visibleTiles: string[];
	columnSizes: number[];
	tileOrder: string[];
}

const DEFAULT_TILES: TileConfig[] = [
	{ id: "editor", label: "Editor", defaultVisible: true, defaultSize: 40 },
	{ id: "terminal", label: "Terminal", defaultVisible: true, defaultSize: 30 },
	{ id: "content", label: "Lesson", defaultVisible: true, defaultSize: 30 },
	{ id: "hints", label: "Hints", defaultVisible: false, defaultSize: 25 },
	{ id: "questions", label: "Questions", defaultVisible: false, defaultSize: 25 },
	{ id: "fileExplorer", label: "Files", defaultVisible: false, defaultSize: 20 },
];

const TILE_MAP = new Map<string, TileConfig>(
	DEFAULT_TILES.map((t) => [t.id, t]),
);

// ── Helpers ────────────────────────────────────────────────────────────────────

function writeBlock(terminal: Terminal, lines: readonly string[]): void {
	for (const line of lines) {
		terminal.writeln(line);
	}
}

function parseMultiline(value: string, label: string): string[] {
	return value
		.split(/\r?\n/)
		.filter((l) => l.trim().length > 0)
		.map((l) => `${label} ${l}`);
}

function normalizeSizes(sizes: number[], count: number): number[] {
	if (sizes.length === count) return sizes;
	const defaults = DEFAULT_TILES.map((t) => t.defaultSize);
	if (count <= defaults.length) {
		const slice = defaults.slice(0, count);
		const sum = slice.reduce((a, b) => a + b, 0);
		return slice.map((s) => Math.round((s / sum) * 100 * 100) / 100);
	}
	const even = Math.round((100 / count) * 100) / 100;
	return Array.from({ length: count }, () => even);
}

function loadLayout(exerciseId: string): PersistedLayout {
	try {
		const raw = localStorage.getItem(`exercise-${exerciseId}-layout`);
		if (raw) {
			const parsed = JSON.parse(raw) as PersistedLayout;
			if (
				Array.isArray(parsed.visibleTiles) &&
				Array.isArray(parsed.columnSizes) &&
				Array.isArray(parsed.tileOrder)
			) {
				return parsed;
			}
		}
	} catch {
		// ignore corrupt data
	}
	return {
		visibleTiles: DEFAULT_TILES.filter((t) => t.defaultVisible).map((t) => t.id),
		columnSizes: DEFAULT_TILES.filter((t) => t.defaultVisible).map((t) => t.defaultSize),
		tileOrder: DEFAULT_TILES.filter((t) => t.defaultVisible).map((t) => t.id),
	};
}

function persistLayout(exerciseId: string, layout: PersistedLayout): void {
	localStorage.setItem(`exercise-${exerciseId}-layout`, JSON.stringify(layout));
}

// ── Component ──────────────────────────────────────────────────────────────────

interface LessonWorkspaceProps {
	exercise: LearnExercise;
	onPassed: (id: string) => void;
	canEdit: boolean;
	onExerciseUpdated: (u: LearnExercise) => void;
}

export function LessonWorkspace({
	exercise,
	onPassed,
	canEdit,
	onExerciseUpdated,
}: LessonWorkspaceProps) {
	const [code, setCode] = useState(exercise.starterCode);
	const [running, setRunning] = useState(false);
	const [result, setResult] = useState<CheckResponse | null>(null);
	const [activeHint, setActiveHint] = useState(0);

	// ── Tile layout state ─────────────────────────────────────────────────────

	const [layout, setLayout] = useState<PersistedLayout>(() =>
		loadLayout(exercise.id),
	);
	const [activeTile, setActiveTile] = useState<string | null>(
		layout.visibleTiles.length > 0 ? layout.visibleTiles[0] : null,
	);

	// Reset tile layout when exercise changes
	useEffect(() => {
		const loaded = loadLayout(exercise.id);
		setLayout(loaded);
		setActiveTile(loaded.visibleTiles.length > 0 ? loaded.visibleTiles[0] : null);
	}, [exercise.id]);

	// Persist layout on change
	useEffect(() => {
		persistLayout(exercise.id, layout);
	}, [exercise.id, layout]);

	const visibleTiles = useMemo(() => {
		return layout.tileOrder
			.filter((id) => layout.visibleTiles.includes(id))
			.map((id) => ({ id, label: TILE_MAP.get(id)?.label ?? id }));
	}, [layout]);

	const hiddenTiles = useMemo(() => {
		return DEFAULT_TILES.filter(
			(t) => !layout.visibleTiles.includes(t.id),
		);
	}, [layout.visibleTiles]);

	const openTile = useCallback((id: string) => {
		setLayout((prev) => {
			if (prev.visibleTiles.includes(id)) return prev;
			const tile = TILE_MAP.get(id);
			const defaultSize = tile?.defaultSize ?? 20;
			const newSizes = normalizeSizes(
				[...prev.columnSizes, defaultSize],
				prev.visibleTiles.length + 1,
			);
			return {
				visibleTiles: [...prev.visibleTiles, id],
				tileOrder: [...prev.tileOrder, id],
				columnSizes: newSizes,
			};
		});
		setActiveTile(id);
	}, []);

	const closeTile = useCallback(
		(id: string) => {
			setLayout((prev) => {
				const idx = prev.visibleTiles.indexOf(id);
				if (idx === -1) return prev;
				const newVisible = prev.visibleTiles.filter((v) => v !== id);
				const newOrder = prev.tileOrder.filter((v) => v !== id);
				const newSizes = prev.columnSizes.filter((_, i) => i !== idx);
				const normalized = normalizeSizes(newSizes, newVisible.length);
				return {
					visibleTiles: newVisible,
					tileOrder: newOrder,
					columnSizes: normalized,
				};
			});
			setActiveTile((prev) => {
				if (prev === id) {
					const idx = layout.visibleTiles.indexOf(id);
					const remaining = layout.visibleTiles.filter((v) => v !== id);
					if (remaining.length === 0) return null;
					return remaining[Math.min(idx, remaining.length - 1)] ?? null;
				}
				return prev;
			});
		},
		[layout.visibleTiles],
	);

	const handleColumnSizesChange = useCallback((sizes: number[]) => {
		setLayout((prev) => ({ ...prev, columnSizes: sizes }));
	}, []);

	// ── Terminal ──────────────────────────────────────────────────────────────

	const terminalRef = useRef<HTMLDivElement | null>(null);
	const terminalShell = useRef<Terminal | null>(null);
	const fitAddon = useRef(new FitAddon());

	useEffect(() => {
		const term = new Terminal({
			convertEol: true,
			scrollback: 5000,
			theme: {
				background: "#101828",
				foreground: "#e6f0ff",
				cursor: "#8fb0ff",
			},
			fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
			fontSize: 14,
		});

		terminalShell.current = term;
		term.loadAddon(fitAddon.current);

		if (terminalRef.current) {
			term.open(terminalRef.current);
		}
		fitAddon.current.fit();

		term.writeln("Beskid Learn terminal ready.");
		term.writeln(`Exercise: ${exercise.title}`);

		const handleResize = () => {
			fitAddon.current.fit();
		};
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			term.dispose();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [exercise.title]);

	// Reset on exercise change
	useEffect(() => {
		setCode(exercise.starterCode);
		setResult(null);
		setActiveHint(0);
	}, [exercise.starterCode]);

	// ── Monaco language registration ──────────────────────────────────────────

	const handleLanguageReady = useCallback(
		(
			_editor: monacoEditor.editor.IStandaloneCodeEditor,
			monaco: typeof monacoEditor,
		) => {
			// registerBeskidLanguage is inlined here to avoid circular dependency
			const languageId = "beskid";
			if (!monaco.languages.getLanguages().some((l) => l.id === languageId)) {
				monaco.languages.register({ id: languageId, aliases: ["Beskid"] });
				monaco.languages.setLanguageConfiguration(languageId, {
					comments: { lineComment: "//" },
					brackets: [
						["{", "}"],
						["(", ")"],
						["[", "]"],
					],
					autoClosingPairs: [
						{ open: "{", close: "}" },
						{ open: "(", close: ")" },
						{ open: "[", close: "]" },
					],
				});
				monaco.languages.setMonarchTokensProvider(languageId, {
					tokenizer: {
						root: [
							[/\b(fn|pub|let|use|return|if|else|while|for|break|continue)\b/, "keyword"],
							[/\b(i32|i64|u32|u64|f32|f64|string|bool|unit|true|false)\b/, "type"],
							[/\/\/.*$/, "comment"],
							[/"(?:[^"\\]|\\.)*"/, "string"],
							[/'[^']*'/, "string"],
							[/[0-9]+/, "number"],
						],
					},
				});
			}
			const model = _editor.getModel();
			if (model) {
				monaco.editor.setModelLanguage(model, "beskid");
			}
		},
		[],
	);

	// ── Run check ──────────────────────────────────────────────────────────────

	const runCheck = useCallback(() => {
		const term = terminalShell.current;
		if (!term || running) return;

		setRunning(true);
		term.clear();

		writeBlock(term, [
			`Running: ${exercise.command}`,
			`Mode: ${validateModeForExercise(exercise)}`,
		]);

		fetch("/api/check", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				exerciseId: exercise.id,
				code,
				command: exercise.command,
			}),
		})
			.then((r) => r.json())
			.then((data: CheckResponse) => {
				setResult(data);

				writeBlock(term, [
					`command: ${data.command}`,
					`exitCode: ${String(data.exitCode)}`,
					`duration: ${data.durationMs}ms`,
				]);

				if (typeof data.expectedOutput === "string") {
					writeBlock(term, [
						`expected output: ${JSON.stringify(data.expectedOutput)}`,
						`matched: ${data.expectedOutputMatched ? "yes" : "no"}`,
					]);
				}

				writeBlock(term, parseMultiline(data.diagnosticsSummary, "[summary]"));
				writeBlock(term, parseMultiline(data.stdout, "[stdout]"));
				writeBlock(term, parseMultiline(data.stderr, "[stderr]"));
				writeBlock(term, ["-----"]);

				writeBlock(term, [
					data.success
						? "Result: PASS"
						: data.error
							? `Check failed: ${data.error}`
							: "Result: FAIL",
				]);

				if (data.success) {
					onPassed(exercise.id);
				}
			})
			.catch((err: unknown) => {
				const message = err instanceof Error ? err.message : "Unknown check error";
				writeBlock(term, ["Term request failed:", message]);
			})
			.finally(() => {
				setRunning(false);
			});
	}, [exercise, code, running, onPassed]);

	// ── Difficulty class ──────────────────────────────────────────────────────

	const difficultyClass =
		exercise.difficulty === "beginner"
			? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
			: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";

	// ── Tile renderers ────────────────────────────────────────────────────────

	const renderTile = useCallback(
		(id: string) => {
			switch (id) {
				case "editor":
					return (
						<div className="workspace-tile-content editor-pane">
							<div className="editor-toolbar">
								<Badge variant="outline" className="text-xs">
									{exercise.command}
								</Badge>
								<div className="flex gap-2 ml-auto">
									<Button
										size="xs"
										variant="ghost"
										onClick={() => setCode(exercise.starterCode)}
									>
										<RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
									</Button>
									<Button size="sm" onClick={runCheck} disabled={running} className="run-btn">
										<Play className="w-3.5 h-3.5 mr-1" />{" "}
										{running ? "Running..." : "Run"}
									</Button>
								</div>
							</div>
							<Editor
								height="100%"
								defaultLanguage="beskid"
								theme="vs-dark"
								value={code}
								onChange={(v) => setCode(v ?? "")}
								onMount={handleLanguageReady}
								options={{
									fontFamily:
										"JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
									minimap: { enabled: false },
									tabSize: 2,
									automaticLayout: true,
								}}
							/>
						</div>
					);

				case "terminal":
					return (
						<div className="workspace-tile-content terminal-pane">
							<div className="terminal-header">
								<TerminalIcon className="w-3.5 h-3.5" />
								<span className="text-xs">Output</span>
								{result && (
									<Badge
										className={clsx(
											"ml-auto text-xs",
											result.success
												? "bg-emerald-500/20 text-emerald-400 pass-shimmer"
												: "bg-red-500/20 text-red-400 fail-shake",
										)}
									>
										{result.success ? "PASS" : "FAIL"}
									</Badge>
								)}
							</div>
							<div className="terminal-container" ref={terminalRef} />
						</div>
					);

				case "content":
					return (
						<div className="workspace-tile-content lesson-header-card">
							<div className="flex items-center gap-2 mb-3 p-3 pb-0">
								<BookOpen className="w-4 h-4 text-primary shrink-0" />
								<div className="min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<h2 className="text-base font-semibold truncate">
											{exercise.title}
										</h2>
										<Badge variant="secondary" className={clsx("text-xs shrink-0", difficultyClass)}>
											{exercise.difficulty}
										</Badge>
									</div>
									<p className="text-muted-foreground text-xs line-clamp-2">
										{exercise.objective}
									</p>
								</div>
							</div>
							<div className="px-3 pb-3 overflow-y-auto">
								{exercise.detailedContent ? (
									<LessonContent markdown={exercise.detailedContent} />
								) : (
									<p className="text-muted-foreground text-sm italic">
										No lesson content available.
									</p>
								)}
							</div>
						</div>
					);

				case "hints":
					return (
						<div className="workspace-tile-content hints-card">
							<div className="flex items-center gap-2 mb-3">
								<Lightbulb className="w-4 h-4 text-amber-500" />
								<h3 className="text-sm font-semibold">Hints</h3>
								{exercise.hints.length > 0 && (
									<Badge variant="outline" className="text-xs">
										{activeHint + 1}/{exercise.hints.length}
									</Badge>
								)}
							</div>
							{exercise.hints.length > 0 ? (
								<>
									<div className="hint-content animate-fade-in" key={activeHint}>
										<CodeHighlight language="beskid">
											{exercise.hints[activeHint]}
										</CodeHighlight>
									</div>
									<div className="flex gap-2 mt-2">
										<Button
											variant="ghost"
											size="xs"
											disabled={activeHint === 0}
											onClick={() => setActiveHint((h) => h - 1)}
										>
											Prev
										</Button>
										<Button
											variant="ghost"
											size="xs"
											disabled={activeHint >= exercise.hints.length - 1}
											onClick={() => setActiveHint((h) => h + 1)}
										>
											Next
										</Button>
									</div>
								</>
							) : (
								<p className="text-muted-foreground text-sm italic">
									No hints for this exercise.
								</p>
							)}
						</div>
					);

				case "questions":
					return (
						<div className="workspace-tile-content questions-card">
							<h3 className="text-sm font-semibold mb-3">
								Check Your Understanding
							</h3>
							{exercise.questions.length > 0 ? (
								<div className="questions-grid">
									{exercise.questions.map((q) => (
										<div className="question-item" key={q.id}>
											<p className="text-sm font-medium mb-2">{q.text}</p>
											<div className="options-list">
												{q.options.map((opt, i) => (
													<button
														type="button"
														className={clsx(
															"option-btn",
															i === q.correctIndex && "option-correct",
														)}
														key={i}
													>
														{i === q.correctIndex && (
															<CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
														)}
														<span className="truncate">{opt}</span>
													</button>
												))}
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-sm italic">
									No questions for this exercise.
								</p>
							)}
						</div>
					);

				case "fileExplorer":
					return (
						<div className="workspace-tile-content">
							<ExplorerTile
								exercise={exercise}
								onFileSelect={(file) => setCode(file.content)}
							/>
						</div>
					);

				default:
					return null;
			}
		},
		[
			exercise,
			code,
			running,
			result,
			activeHint,
			difficultyClass,
			runCheck,
			handleLanguageReady,
		],
	);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="workspace-container">
			<div className="workspace-header">
				<WorkspaceTabs
					tiles={visibleTiles}
					activeTile={activeTile}
					onSelectTile={setActiveTile}
					onCloseTile={closeTile}
				/>
				{hiddenTiles.length > 0 && (
					<div className="workspace-add-tiles">
						{hiddenTiles.map((tile) => (
							<Button
								key={tile.id}
								variant="ghost"
								size="xs"
								onClick={() => openTile(tile.id)}
								title={`Open ${tile.label}`}
							>
								+ {tile.label}
							</Button>
						))}
					</div>
				)}
			</div>

			{visibleTiles.length > 0 ? (
				<ResizableTileGrid
					columnSizes={layout.columnSizes}
					onColumnSizesChange={handleColumnSizesChange}
				>
					{visibleTiles.map((tile) => (
						<div key={tile.id} className="workspace-tile-inner">
							{renderTile(tile.id)}
						</div>
					))}
				</ResizableTileGrid>
			) : (
				<div className="workspace-empty">
					<p className="text-muted-foreground text-sm">
						No tiles open. Click a tile above to add it.
					</p>
				</div>
			)}

			{/* Lesson editor (admin / can-edit) — shown below the workspace */}
			{canEdit && (
				<div className="mt-3">
					<LessonEditor
						lesson={exercise}
						canEdit={canEdit}
						onSaved={onExerciseUpdated}
					/>
				</div>
			)}
		</div>
	);
}

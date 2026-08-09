import { Badge, Button } from "@beskid/ui-react";
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
import { type PointerEvent as ReactPointerEvent, type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "xterm";
import { CodeHighlight } from "#/components/CodeHighlight";
import { ExplorerTile } from "#/components/ExplorerTile";
import { LessonContent } from "#/components/LessonContent";
import { LessonEditor } from "#/components/LessonEditor";
import { WorkspaceTabs, type TileTab } from "#/components/WorkspaceTabs";
import {
	clampSplit,
	MAX_SIZE_PCT,
	MIN_SIZE_PCT,
	mosaicSplitAt,
	type MosaicDirection,
	type MosaicNode,
	updateMosaicSplit,
} from "#/components/workspaceLayout";
import type { LearnExercise } from "#/data/learningCatalog";
import { validateModeForExercise } from "#/data/learningCatalog";

import { parseCheckResponse, parseMultiline, type CheckResponse, writeBlock } from "./checkProtocol";
import {
	buildPersistedFromVisible,
	getTileConfigForExercise,
	HANDLE_SIZE_PX,
	KEYBOARD_SPLIT_STEP,
	loadLayout,
	persistLayout,
	type PersistedLayout,
	TILE_MAP,
} from "./layout";

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
	const [layout, setLayout] = useState<PersistedLayout>(() => loadLayout(exercise));
	const [activeTile, setActiveTile] = useState<string | null>(null);
	const [compact, setCompact] = useState(false);

	const visibleTiles = useMemo(() => {
		const deduped = [...new Set(layout.visibleTiles)].filter((id) => TILE_MAP.has(id));
		return deduped.length > 0 ? deduped : ["editor"];
	}, [layout.visibleTiles]);

	const configTiles = useMemo(() => getTileConfigForExercise(exercise), [exercise]);

	const hiddenTiles = useMemo(() => {
		const allowed = new Set(configTiles.map((tile) => tile.id));
		return configTiles.filter((tile) => !visibleTiles.includes(tile.id) && allowed.has(tile.id));
	}, [configTiles, visibleTiles]);

	const visibleTabs: TileTab[] = useMemo(
		() =>
			visibleTiles.map((id) => ({
				id,
				label: TILE_MAP.get(id)?.label ?? id,
			})),
		[visibleTiles],
	);

	const difficultyClass =
		exercise.difficulty === "beginner"
			? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
			: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";

	useEffect(() => {
		setCompact(window.matchMedia("(max-width: 1279px)").matches);
		const mediaQuery = window.matchMedia("(max-width: 1279px)");
		const updateCompact = () => setCompact(mediaQuery.matches);
		mediaQuery.addEventListener("change", updateCompact);
		return () => mediaQuery.removeEventListener("change", updateCompact);
	}, []);

	useEffect(() => {
		if (activeTile && visibleTiles.includes(activeTile)) return;
		setActiveTile(visibleTiles[0] ?? null);
	}, [activeTile, visibleTiles]);

	useEffect(() => {
		setLayout(loadLayout(exercise));
		setCode(exercise.starterCode);
		setResult(null);
		setActiveHint(0);
	}, [exercise]);

	useEffect(() => {
		persistLayout(exercise, layout);
	}, [exercise.id, layout]);

	const terminalRef = useRef<HTMLDivElement | null>(null);
	const terminalShell = useRef<Terminal | null>(null);
	const fitAddon = useRef(new FitAddon());
	const resizeCleanup = useRef<(() => void) | null>(null);

	useEffect(() => {
		return () => resizeCleanup.current?.();
	}, []);

	useEffect(() => {
		const terminal = new Terminal({
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
		terminalShell.current = terminal;
		terminal.loadAddon(fitAddon.current);
		if (terminalRef.current) terminal.open(terminalRef.current);
		fitAddon.current.fit();
		terminal.writeln("Beskid Learn terminal ready.");
		terminal.writeln(`Exercise: ${exercise.title}`);

		const handleResize = () => fitAddon.current.fit();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			terminal.dispose();
		};
	}, [exercise.title]);

	const handleLanguageReady = useCallback(
		(
			editor: monacoEditor.editor.IStandaloneCodeEditor,
			monaco: typeof monacoEditor,
		) => {
			const languageId = "beskid";
			if (!monaco.languages.getLanguages().some((lang) => lang.id === languageId)) {
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
							[/\"(?:[^\"\\]|\\.)*\"/, "string"],
							[/'(?:[^'\\]|\\.)*'/, "string"],
							[/[0-9]+/, "number"],
						],
					},
				});
			}

			const model = editor.getModel();
			if (model) {
				monaco.editor.setModelLanguage(model, languageId);
			}
		},
		[],
	);

	const runCheck = useCallback(() => {
		const term = terminalShell.current;
		if (!term || running) {
			return;
		}

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
			.then(async (response) => {
				const body = await response.text();
				if (!response.ok) {
					throw new Error(
						`Check request failed: ${response.status} ${response.statusText}. ${body.slice(0, 180)}`,
					);
				}
				return parseCheckResponse(body);
			})
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
				if (data.success) onPassed(exercise.id);
			})
			.catch((error: unknown) => {
				writeBlock(term, [
					"Terminal request failed:",
					error instanceof Error ? error.message : "Unknown check error",
				]);
			})
			.finally(() => {
				setRunning(false);
			});
	}, [code, exercise, onPassed, running]);

	const openTile = useCallback(
		(tileId: string) => {
			setLayout((prev) => {
				if (prev.visibleTiles.includes(tileId)) return prev;
				const order = configTiles.map((tile) => tile.id);
				const merged = [...new Set([...prev.visibleTiles, tileId])];
				const nextVisible = order.filter((id) => merged.includes(id));
				return buildPersistedFromVisible(nextVisible, exercise);
			});
			setActiveTile(tileId);
		},
		[configTiles, exercise],
	);

	const closeTile = useCallback(
		(tileId: string, replacementId: string | null) => {
			setLayout((prev) => {
				if (!prev.visibleTiles.includes(tileId)) return prev;
				const nextVisible = prev.visibleTiles.filter((id) => id !== tileId);
				if (nextVisible.length === 0) {
					return buildPersistedFromVisible([], exercise);
				}
				return buildPersistedFromVisible(nextVisible, exercise);
			});
			setActiveTile((current) => (current === tileId ? replacementId : current));
		},
		[exercise],
	);

	const resizeSplit = useCallback((path: readonly number[], split: number) => {
		setLayout((previous) => ({
			...previous,
			tree: updateMosaicSplit(previous.tree, path, split),
		}));
	}, []);

	const startResize = useCallback(
		(path: readonly number[], direction: MosaicDirection) =>
			(event: ReactPointerEvent<HTMLButtonElement>) => {
				const container = event.currentTarget.parentElement;
				if (!container) return;

				const bounds = container.getBoundingClientRect();
				const axisSize = direction === "vertical" ? bounds.width : bounds.height;
				if (axisSize <= HANDLE_SIZE_PX) return;

				const initialSplit = mosaicSplitAt(layout.tree, path);
				const origin = direction === "vertical" ? event.clientX : event.clientY;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				resizeCleanup.current?.();

				const handleMove = (moveEvent: PointerEvent) => {
					const current = direction === "vertical" ? moveEvent.clientX : moveEvent.clientY;
					resizeSplit(path, initialSplit + ((current - origin) / axisSize) * 100);
				};
				const cleanup = () => {
					window.removeEventListener("pointermove", handleMove);
					window.removeEventListener("pointerup", cleanup);
					window.removeEventListener("pointercancel", cleanup);
					if (resizeCleanup.current === cleanup) resizeCleanup.current = null;
				};

				resizeCleanup.current = cleanup;
				window.addEventListener("pointermove", handleMove);
				window.addEventListener("pointerup", cleanup);
				window.addEventListener("pointercancel", cleanup);
			},
		[layout.tree, resizeSplit],
	);

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
										variant="ghost"
										size="xs"
										onClick={() => setCode(exercise.starterCode)}
									>
										<RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
									</Button>
									<Button
										variant="default"
										size="sm"
										onClick={runCheck}
										disabled={running}
										className="run-btn"
									>
										<Play className="w-3.5 h-3.5 mr-1" />
										{running ? "Running..." : "Run"}
									</Button>
								</div>
							</div>
							<Editor
								height="100%"
								defaultLanguage="beskid"
								theme="vs-dark"
								value={code}
								onChange={(value) => setCode(value ?? "")}
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
										<Badge
											variant="secondary"
											className={clsx("text-xs shrink-0", difficultyClass)}
										>
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
										onClick={() => setActiveHint((value) => value - 1)}
									>
										Prev
									</Button>
									<Button
										variant="ghost"
										size="xs"
										disabled={activeHint >= exercise.hints.length - 1}
										onClick={() => setActiveHint((value) => value + 1)}
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
							<h3 className="text-sm font-semibold mb-3">Check Your Understanding</h3>
							{exercise.questions.length > 0 ? (
								<div className="questions-grid">
									{exercise.questions.map((q) => (
										<div className="question-item" key={q.id}>
											<p className="text-sm font-medium mb-2">{q.text}</p>
											<div className="options-list">
												{q.options.map((option, index) => (
													<button
														type="button"
														className={clsx(
															"option-btn",
															index === q.correctIndex && "option-correct",
														)}
														key={index}
													>
													{index === q.correctIndex && (
														<CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
													)}
													<span className="truncate">{option}</span>
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
 [activeHint, difficultyClass, exercise, handleLanguageReady, running, result, code, runCheck],
);

	const renderMosaic = useCallback(
		(node: MosaicNode, key: string, path: readonly number[] = []): ReactElement => {
			if (node.kind === "leaf") {
				return (
					<div
						key={key}
						id={`workspace-panel-${node.tileId}`}
						aria-labelledby={`workspace-tab-${node.tileId}`}
						className="workspace-mosaic-leaf"
					>
						{renderTile(node.tileId)}
					</div>
				);
			}

			const split = clampSplit(node.split);
			const first = renderMosaic(node.first, `${key}-0`, [...path, 0]);
			const second = renderMosaic(node.second, `${key}-1`, [...path, 1]);

			return (
				<div
					key={key}
					className="workspace-mosaic-split"
					style={{
						display: "grid",
						gridTemplateColumns:
							node.direction === "vertical" ? `${split}fr ${HANDLE_SIZE_PX}px ${100 - split}fr` : undefined,
						gridTemplateRows:
							node.direction === "horizontal" ? `${split}fr ${HANDLE_SIZE_PX}px ${100 - split}fr` : undefined,
					}}
				>
					{first}
					<button
						type="button"
						aria-orientation={node.direction === "vertical" ? "vertical" : "horizontal"}
						aria-label="Resize separator"
						aria-valuemin={MIN_SIZE_PCT}
						aria-valuemax={MAX_SIZE_PCT}
						aria-valuenow={split}
						className={
							node.direction === "vertical"
								? "workspace-mosaic-handle workspace-mosaic-handle--vertical"
								: "workspace-mosaic-handle workspace-mosaic-handle--horizontal"
						}
						style={
							node.direction === "vertical"
								? { width: `${HANDLE_SIZE_PX}px` }
								: { height: `${HANDLE_SIZE_PX}px` }
						}
						role="separator"
						tabIndex={0}
						onPointerDown={startResize(path, node.direction)}
						onKeyDown={(event) => {
							const decreases =
								node.direction === "vertical"
									? event.key === "ArrowLeft"
									: event.key === "ArrowUp";
							const increases =
								node.direction === "vertical"
									? event.key === "ArrowRight"
									: event.key === "ArrowDown";
							if (!decreases && !increases) return;
							event.preventDefault();
							resizeSplit(
								path,
								mosaicSplitAt(layout.tree, path) +
									(increases ? KEYBOARD_SPLIT_STEP : -KEYBOARD_SPLIT_STEP),
							);
						}}
					/>
					{second}
				</div>
			);
		},
		[layout.tree, renderTile, resizeSplit, startResize],
	);

	return (
		<div className="workspace-container">
			<div className="workspace-header">
				<WorkspaceTabs
					tiles={visibleTabs}
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

			{compact && activeTile ? (
				<div className="workspace-mosaic-root workspace-mosaic-root--compact">
					{renderTile(activeTile)}
				</div>
			) : visibleTiles.length > 0 ? (
				<div className="workspace-mosaic-root">{renderMosaic(layout.tree, "root")}</div>
			) : (
				<div className="workspace-empty">
					<p className="text-muted-foreground text-sm">
						No tiles open. Click a tile above to add it.
					</p>
				</div>
			)}

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

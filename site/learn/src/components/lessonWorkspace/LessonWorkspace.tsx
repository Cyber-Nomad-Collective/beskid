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
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "xterm";
import { CodeHighlight } from "#/components/CodeHighlight";
import { ExplorerTile } from "#/components/ExplorerTile";
import { LessonContent } from "#/components/LessonContent";
import { GuidedLessonRail } from "./GuidedLessonRail";
import { type MosaicNode } from "#/components/workspaceLayout";
import type { LearnExercise } from "#/data/learningCatalog";
import { validateModeForExercise } from "#/data/learningCatalog";

import { parseCheckResponse, parseMultiline, type CheckResponse, writeBlock } from "./checkProtocol";
import { buildLessonTileLayout } from "./layout";
import { getLessonSteps, type LessonStepStatus, validateSourceStep } from "./steps";
import { attachBeskidLsp, registerBeskidLanguage } from "#/lib/beskidLspClient";

interface LessonWorkspaceProps {
	exercise: LearnExercise;
	onPassed: (id: string) => void;
}

export function LessonWorkspace({
	exercise,
	onPassed,
}: LessonWorkspaceProps) {
	const [code, setCode] = useState(exercise.starterCode);
	const [running, setRunning] = useState(false);
	const [result, setResult] = useState<CheckResponse | null>(null);
	const [activeHint, setActiveHint] = useState(0);
	const layout = useMemo(() => buildLessonTileLayout(exercise), [exercise]);
	const steps = useMemo(() => getLessonSteps(exercise), [exercise]);
	const [activeStep, setActiveStep] = useState(0);
	const [stepStatuses, setStepStatuses] = useState<LessonStepStatus[]>(() => steps.map((_, index) => index === 0 ? "current" : "locked"));
	const [stepMessage, setStepMessage] = useState<string | null>(null);
	const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
	const lspDisposableRef = useRef<{ dispose(): void } | null>(null);
	const decorationsRef = useRef<string[]>([]);

	const difficultyClass =
		exercise.difficulty === "beginner"
			? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
			: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";

	useEffect(() => {
		return () => lspDisposableRef.current?.dispose();
	}, []);

	useEffect(() => {
		setCode(exercise.starterCode);
		setResult(null);
		setActiveHint(0);
		setActiveStep(0);
		setStepStatuses(steps.map((_, index) => index === 0 ? "current" : "locked"));
		setStepMessage(null);
	}, [exercise, steps]);

	const terminalRef = useRef<HTMLDivElement | null>(null);
	const terminalShell = useRef<Terminal | null>(null);
	const fitAddon = useRef(new FitAddon());
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
			editorRef.current = editor;
			registerBeskidLanguage(monaco);

			const model = editor.getModel();
			if (model) {
				monaco.editor.setModelLanguage(model, "beskid");
			}
			lspDisposableRef.current?.dispose();
			lspDisposableRef.current = attachBeskidLsp(editor, monaco);
		},
		[],
	);

	useEffect(() => {
		const editor = editorRef.current;
		const focus = steps[activeStep]?.focus;
		const model = editor?.getModel();
		if (!editor || !focus || !model) return;
		decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
			range: {
				startLineNumber: focus.startLine,
				startColumn: focus.startColumn ?? 1,
				endLineNumber: focus.endLine,
				endColumn: focus.endColumn ?? model.getLineMaxColumn(focus.endLine),
			},
			options: { isWholeLine: true, className: "lesson-code-focus", inlineClassName: "lesson-code-focus-inline" },
		}]);
		editor.revealLineInCenter(focus.startLine);
		return () => {
			decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
		};
	}, [activeStep, steps]);

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
				if (data.success) {
					onPassed(exercise.id);
					if (activeStep < steps.length - 1) setActiveStep((current) => current + 1);
				}
				setStepStatuses((current) => current.map((status, index) => index === activeStep ? (data.success ? "passed" : "failed") : index === activeStep + 1 && data.success ? "current" : status));
				setStepMessage(data.success ? "Step complete." : "The check found something to fix. Read the output and try again.");
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
	}, [activeStep, code, exercise, onPassed, running]);

	const checkStep = useCallback(() => {
		const step = steps[activeStep];
		if (!step) return;
		if (step.check?.kind === "source") {
			const validation = validateSourceStep(step, code);
			setStepMessage(validation.message);
			setStepStatuses((current) => current.map((status, index) => index === activeStep ? (validation.ok ? "passed" : "failed") : index === activeStep + 1 && validation.ok ? "current" : status));
			if (validation.ok && activeStep < steps.length - 1) setActiveStep((current) => current + 1);
			return;
		}
		if (step.check?.kind === "command") return runCheck();
		setStepStatuses((current) => current.map((status, index) => index === activeStep ? "passed" : index === activeStep + 1 ? "current" : status));
		setStepMessage("Step complete.");
		if (activeStep < steps.length - 1) setActiveStep((current) => current + 1);
	}, [activeStep, code, runCheck, steps]);

	const selectStep = useCallback((index: number) => {
		if (stepStatuses[index] === "locked") return;
		setActiveStep(index);
		setStepMessage(null);
	}, [stepStatuses]);

	const previousStep = useCallback(() => {
		setActiveStep((current) => Math.max(0, current - 1));
		setStepMessage(null);
	}, []);

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
		(node: MosaicNode, key: string): ReactElement => {
			if (node.kind === "leaf") {
				return (
					<div
						key={key}
						id={`workspace-panel-${node.tileId}`}
						className="workspace-mosaic-leaf"
					>
						{renderTile(node.tileId)}
					</div>
				);
			}

			const first = renderMosaic(node.first, `${key}-0`);
			const second = renderMosaic(node.second, `${key}-1`);

			return (
				<div
					key={key}
					className="workspace-mosaic-split"
					style={{
						display: "grid",
						gridTemplateColumns:
								node.direction === "vertical" ? `${node.split}fr ${100 - node.split}fr` : undefined,
						gridTemplateRows:
								node.direction === "horizontal" ? `${node.split}fr ${100 - node.split}fr` : undefined,
					}}
				>
					{first}
					{second}
				</div>
			);
		},
		[renderTile],
	);

	return (
		<div className="workspace-container">
			<div className="workspace-guided-layout">
				<div className="workspace-fixed-mosaic">{renderMosaic(layout, "root")}</div>
				<GuidedLessonRail title={exercise.title} steps={steps} activeStep={activeStep} statuses={stepStatuses} message={stepMessage} onSelectStep={selectStep} onCheck={checkStep} onPrevious={previousStep} />
			</div>
		</div>
	);
}

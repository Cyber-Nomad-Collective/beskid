import { Badge, BeskidHub, Button, Card, Separator } from "@beskid/ui-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@beskid/ui-react/ui/sheet";
import { Editor } from "@monaco-editor/react";
import { FitAddon } from "@xterm/addon-fit";
import { clsx } from "clsx";
import {
	BookOpen,
	CheckCircle,
	FlaskConical,
	GraduationCap,
	LayoutList,
	Lightbulb,
	PanelLeftClose,
	PanelLeftOpen,
	Play,
	RotateCcw,
	TerminalIcon,
} from "lucide-react";
import type * as monacoEditor from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "xterm";
import { AuthGate, UserBadge } from "#/components/AuthGate";
import { CodeHighlight } from "#/components/CodeHighlight";
import { LessonContent } from "#/components/LessonContent";
import LessonCard from "#/components/LessonCard";
import { LessonEditor } from "#/components/LessonEditor";
import { LessonWorkspace } from "#/components/LessonWorkspace";
import Playground from "#/components/Playground";
import ProgressTracker from "#/components/ProgressTracker";
import {
	type LearnExercise,
	learnExercises,
	validateModeForExercise,
} from "#/data/learningCatalog";
import type { AuthUser } from "#/lib/auth";
import "xterm/css/xterm.css";
import "./styles.css";

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

type ViewMode = "lesson" | "playground";

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

function parseCheckResponse(payload: string): CheckResponse {
	const trimmed = payload.trim();
	if (!trimmed) {
		throw new Error("Check endpoint returned an empty response.");
	}

	if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
		throw new Error("Check endpoint returned HTML or plain text instead of JSON.");
	}

	try {
		return JSON.parse(trimmed) as CheckResponse;
	} catch (error) {
		throw new Error(
			error instanceof Error ? `Invalid JSON from check endpoint: ${error.message}` : "Invalid JSON from check endpoint.",
		);
	}
}

function registerBeskidLanguage(monaco: typeof monacoEditor): void {
	const languageId = "beskid";
	if (monaco.languages.getLanguages().some((l) => l.id === languageId)) {
		return;
	}

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

// ── Components ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
	basics: "Basics",
	functions: "Functions",
	"control-flow": "Control Flow",
	parsing: "Parsing",
	runtime: "Runtime",
};

interface LessonViewProps {
	exercise: LearnExercise;
	onPassed: (id: string) => void;
	canEdit: boolean;
	onExerciseUpdated: (u: LearnExercise) => void;
}

/** Kept as reference — replaced by LessonWorkspace with horizontal tiled layout. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function __LessonViewLegacy({
	exercise,
	onPassed,
	canEdit,
	onExerciseUpdated,
}: LessonViewProps) {
	const [code, setCode] = useState(exercise.starterCode);
	const [running, setRunning] = useState(false);
	const [result, setResult] = useState<CheckResponse | null>(null);
	const [activeHint, setActiveHint] = useState(0);

	const terminalRef = useRef<HTMLDivElement | null>(null);
	const terminalShell = useRef<Terminal | null>(null);
	const fitAddon = useRef(new FitAddon());

	// ── Terminal initialisation (once) ─────────────────────────────────────────

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

	// ── Reset on exercise change ───────────────────────────────────────────────

	useEffect(() => {
		setCode(exercise.starterCode);
		setResult(null);
		setActiveHint(0);
	}, [exercise.starterCode]);

	// ── Monaco language registration ───────────────────────────────────────────

	const handleLanguageReady = useCallback(
		(
			_editor: monacoEditor.editor.IStandaloneCodeEditor,
			monaco: typeof monacoEditor,
		) => {
			registerBeskidLanguage(monaco);
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
				const data = parseCheckResponse(body);
				setResult(data);
				return data;
			})
			.then((data: CheckResponse) => {
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
				writeBlock(term, ["Terminal request failed:", message]);
			})
			.finally(() => {
				setRunning(false);
			});
	}, [exercise, code, running, onPassed]);

	// ── JSX ────────────────────────────────────────────────────────────────────

	const difficultyClass =
		exercise.difficulty === "beginner"
			? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
			: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";

	return (
		<div className="lesson-view" style={{ viewTransitionName: "lesson-content" }}>
			{/* Header */}
			<Card className="lesson-header-card">
				<div className="lesson-header-content">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<BookOpen className="w-5 h-5 text-primary" />
							<h2 className="text-xl font-semibold">{exercise.title}</h2>
							<Badge variant="secondary" className={difficultyClass}>
								{exercise.difficulty}
							</Badge>
						</div>
						<p className="text-muted-foreground text-sm">{exercise.objective}</p>
					</div>
				</div>
			</Card>

			{/* Detailed content */}
			{exercise.detailedContent && (
				<Card className="lesson-content-card">
					<LessonContent markdown={exercise.detailedContent} />
				</Card>
			)}

			{/* Hints */}
			{exercise.hints.length > 0 && (
				<Card className="hints-card">
					<div className="flex items-center gap-2 mb-3">
						<Lightbulb className="w-4 h-4 text-amber-500" />
						<h3 className="text-sm font-semibold">Hints</h3>
						<Badge variant="outline" className="text-xs">
							{activeHint + 1}/{exercise.hints.length}
						</Badge>
					</div>

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
				</Card>
			)}

			{/* Questions */}
			{exercise.questions.length > 0 && (
				<Card className="questions-card">
					<h3 className="text-sm font-semibold mb-3">Check Your Understanding</h3>
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
												<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
											)}
											{opt}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			{/* Editor + Terminal grid */}
			<div className="editor-terminal-grid">
				<div className="editor-pane">
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
								<Play className="w-3.5 h-3.5 mr-1" /> {running ? "Running..." : "Run"}
							</Button>
						</div>
					</div>

					<Editor
						height="400px"
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

				<div className="terminal-pane">
					<div className="terminal-header">
						<TerminalIcon className="w-3.5 h-3.5" />
						<span className="text-xs">Output</span>
						{result && (
							<Badge
								key={`result-${result.durationMs}`}
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
			</div>

			{/* Lesson editor (admin / can-edit) */}
			{canEdit && (
				<LessonEditor
					lesson={exercise}
					canEdit={canEdit}
					onSaved={onExerciseUpdated}
				/>
			)}
		</div>
	);
}

// ── App ────────────────────────────────────────────────────────────────────────

function App() {
	const [activeExercise, setActiveExercise] = useState(learnExercises[0]);
	const [passedLessons, setPassedLessons] = useState<Record<string, boolean>>(
		() => {
			try {
				return JSON.parse(
					localStorage.getItem("beskid-learn-passed") ?? "{}",
				) as Record<string, boolean>;
			} catch {
				return {};
			}
		},
	);
	const [viewMode, setViewMode] = useState<ViewMode>("lesson");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isCompact, setIsCompact] = useState(() => window.matchMedia("(max-width: 1279px)").matches);
	useEffect(() => {
		const media = window.matchMedia("(max-width: 1279px)");
		const update = () => setIsCompact(media.matches);
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	// ── Persist passed lessons ─────────────────────────────────────────────────

	useEffect(() => {
		localStorage.setItem("beskid-learn-passed", JSON.stringify(passedLessons));
	}, [passedLessons]);

	// ── Handlers ───────────────────────────────────────────────────────────────

	const handlePassed = useCallback((exerciseId: string) => {
		setPassedLessons((prev) => {
			const next: Record<string, boolean> = {};
			for (const key of Object.keys(prev)) {
				next[key] = prev[key];
			}
			next[exerciseId] = true;
			return next;
		});
	}, []);

	const handleExerciseUpdated = useCallback((updated: LearnExercise) => {
		setActiveExercise(updated);
	}, []);

	// ── Derived state ──────────────────────────────────────────────────────────

	const completedCount = useMemo(
		() => Object.values(passedLessons).filter(Boolean).length,
		[passedLessons],
	);

	const categories = useMemo(() => {
		const map: Record<
			string,
			{ label: string; count: number; completed: number }
		> = {};

		for (const ex of learnExercises) {
			if (!map[ex.category]) {
				map[ex.category] = {
					label: CATEGORY_LABELS[ex.category] ?? ex.category,
					count: 0,
					completed: 0,
				};
			}
			map[ex.category].count++;
			if (passedLessons[ex.id]) {
				map[ex.category].completed++;
			}
		}

		return map;
	}, [passedLessons]);

	// ── JSX ────────────────────────────────────────────────────────────────────

	return (
		<AuthGate requireAuth>
			{(user: AuthUser | null) => (
				<div className="learn-shell">
					<header className="learn-header">
						<div className="learn-header-left">
							<BeskidHub />
							<GraduationCap className="w-6 h-6 text-primary" />
							<h1 className="text-xl font-bold">Beskid Learn</h1>

							{viewMode === "playground" ? (
								<Badge>
									<FlaskConical className="w-3.5 h-3.5 mr-1" /> Playground
								</Badge>
							) : (
								<Badge variant="outline" className="text-xs">
									{completedCount}/{learnExercises.length} done
								</Badge>
							)}
						</div>

						<div className="learn-header-right">
							<div className="flex items-center gap-2">
								<Button
									variant={viewMode === "lesson" ? "default" : "ghost"}
									size="sm"
									onClick={() => setViewMode("lesson")}
								>
									<LayoutList className="w-4 h-4 mr-1.5" /> Lessons
								</Button>
								<Button
									variant={viewMode === "playground" ? "default" : "ghost"}
									size="sm"
									onClick={() => setViewMode("playground")}
								>
									<FlaskConical className="w-4 h-4 mr-1.5" /> Playground
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setSidebarOpen((o) => !o)}
									aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
								>
									{sidebarOpen ? (
										<PanelLeftClose className="w-4 h-4" />
									) : (
										<PanelLeftOpen className="w-4 h-4" />
									)}
								</Button>
							</div>
							{user && <UserBadge user={user} />}
						</div>
					</header>

					<div
						className={clsx("learn-grid", !sidebarOpen && "learn-grid--no-sidebar")}
					>
						<main className="learn-main">
							{viewMode === "playground" ? (
								<div key="playground" className="tab-content-enter">
									<Playground />
								</div>
							) : (
								<div key="lesson" className="tab-content-enter">
									<LessonWorkspace
										exercise={activeExercise}
										onPassed={handlePassed}
										canEdit={user != null && user.login != null}
										onExerciseUpdated={handleExerciseUpdated}
									/>
								</div>
							)}
						</main>

						{sidebarOpen && !isCompact && (
							<aside className="learn-sidebar">
								<Card className="sidebar-card">
									<h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
										<BookOpen className="w-4 h-4 text-primary" />
										Lessons
									</h2>
									<div className="lesson-list-scroll">
										{learnExercises.map((ex) => (
											<LessonCard
												key={ex.id}
												lesson={ex}
												isActive={activeExercise.id === ex.id}
												isCompleted={passedLessons[ex.id] ?? false}
												onSelect={() => {
													setActiveExercise(ex);
													setViewMode("lesson");
												}}
											/>
										))}
									</div>
								</Card>

								<Separator />

								<ProgressTracker
									passedLessons={passedLessons}
									exerciseCount={learnExercises.length}
									categories={categories}
								/>
							</aside>
						)}
						{isCompact && (
							<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
								<SheetContent side="right" className="w-[min(24rem,90vw)] overflow-y-auto">
									<SheetHeader><SheetTitle>Lessons</SheetTitle></SheetHeader>
									<div className="space-y-4 px-4 pb-6">{learnExercises.map((ex) => <LessonCard key={ex.id} lesson={ex} isActive={activeExercise.id === ex.id} isCompleted={passedLessons[ex.id] ?? false} onSelect={() => { setActiveExercise(ex); setViewMode("lesson"); setSidebarOpen(false); }} />)}<ProgressTracker passedLessons={passedLessons} exerciseCount={learnExercises.length} categories={categories} /></div>
								</SheetContent>
							</Sheet>
						)}
					</div>
				</div>
			)}
		</AuthGate>
	);
}

export default App;

import * as monacoEditor from "monaco-editor";
import type { editor as MonacoEditor } from "monaco-editor";
import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { learnExercises, validateModeForExercise } from "./data/learningCatalog";
import "xterm/css/xterm.css";
import "./styles.css";

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

function writeBlock(terminal: Terminal, lines: ReadonlyArray<string>) {
  for (const line of lines) {
    terminal.writeln(line);
  }
}

function parseMultiline(value: string, label: string): string[] {
  return value
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => `${label} ${line}`);
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [code, setCode] = useState(learnExercises[0]?.starterCode ?? "");
  const [status, setStatus] = useState("Start with exercise 1.");
  const [running, setRunning] = useState(false);
  const [passedLessons, setPassedLessons] = useState<Record<string, boolean>>({});
  const [editorModel, setEditorModel] = useState<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoEditor | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const terminalShell = useRef<Terminal | null>(null);
  const fitAddon = useRef(new FitAddon());
  const current = learnExercises[index];
  const passedCount = Object.values(passedLessons).filter(Boolean).length;

  const registerBeskidLanguage = (monaco: typeof monacoEditor) => {
    const languageId = "beskid";
    if (monaco.languages.getLanguages().some((lang) => lang.id === languageId)) {
      return;
    }

    monaco.languages.register({ id: languageId, aliases: ["Beskid"] });
    monaco.languages.setLanguageConfiguration(languageId, {
      comments: {
        lineComment: "//",
      },
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
          ["\\b(fn|pub|let|use|return|if|else|while|for|break|continue)\\b", "keyword"],
          ["\\b(i32|i64|u32|u64|f32|f64|string|bool|unit|true|false)\\b", "type"],
          ["//.*$", "comment"],
          ["\"(?:[^\\\"\\\\]|\\\\.)*\"", "string"],
          ["'[^']*'", "string"],
          ["[0-9]+", "number"],
        ],
      },
    });
  };

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
    fitAddon.current = new FitAddon();
    term.loadAddon(fitAddon.current);
    if (terminalRef.current) {
      term.open(terminalRef.current);
    }
    fitAddon.current.fit();
    term.writeln("Beskid Learn terminal ready.");
    term.writeln(`Current lesson: ${learnExercises[index].title}`);
    term.writeln("Use Run to validate against the real Beskid compiler.");

    const resize = () => fitAddon.current.fit();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      term.dispose();
    };
  }, [index]);

  useEffect(() => {
    const next = terminalShell.current;
    if (!next) {
      return;
    }
    next.clear();
    next.writeln(`Current lesson: ${current.title}`);
    next.writeln(`Objective: ${current.objective}`);
    next.writeln(`Mode: ${validateModeForExercise(current)}`);
  }, [current.id, current.objective, current.title]);

  useEffect(() => {
    if (!editorModel || !monacoRef.current) {
      return;
    }

    const model = editorModel.getModel();
    if (!model) {
      return;
    }

    const markerList: MonacoEditor.IMarkerData[] = current.hints.map((hint) => ({
      message: hint,
      severity: monacoEditor.MarkerSeverity.Info,
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    }));
    monacoRef.current.editor.setModelMarkers(model, "learn", markerList);
  }, [current.id, current.hints]);

  const handleLanguageReady = (
    editor: monacoEditor.editor.IStandaloneCodeEditor,
    monaco: typeof monacoEditor,
  ) => {
    registerBeskidLanguage(monaco);
    monacoRef.current = monaco;
    setEditorModel(editor);
    monaco.editor.setModelLanguage(editor.getModel()!, "beskid");
  };

  const runChecks = async () => {
    if (!terminalShell.current || !current || running) {
      return;
    }
    setRunning(true);

    const term = terminalShell.current;
    term.clear();
    writeBlock(term, [
      `Running: ${current.command}`,
      `Checking lesson ${current.title}`,
      `Mode: ${validateModeForExercise(current)}`,
    ]);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exerciseId: current.id,
          code,
          command: current.command,
        }),
      });

      const result = (await response.json()) as CheckResponse;
      if (!response.ok || !result.success) {
        setStatus(`Exercise ${current.title} still needs fixes.`);
      }

      writeBlock(term, [
        `command: ${result.command}`,
        `exerciseId: ${result.exerciseId}`,
        `exitCode: ${result.exitCode}`,
        `duration: ${result.durationMs}ms`,
      ]);

      if (typeof result.expectedOutput === "string") {
        writeBlock(term, [
          `expected output: ${JSON.stringify(result.expectedOutput)}`,
          `matched: ${result.expectedOutputMatched ? "yes" : "no"}`,
        ]);
      }

      writeBlock(term, parseMultiline(result.diagnosticsSummary, "[summary]"));
      writeBlock(term, parseMultiline(result.stdout, "[stdout]"));
      writeBlock(term, parseMultiline(result.stderr, "[stderr]"));
      writeBlock(term, ["-----"]);

      if (result.success) {
        setStatus(`Great work. ${current.title} passed.`);
        setPassedLessons((previous) => ({
          ...previous,
          [current.id]: true,
        }));
        writeBlock(term, ["Result: PASS"]);
      } else {
        setStatus(result.error ? `Check failed: ${result.error}` : "Check failed. See terminal output.");
        writeBlock(term, ["Result: FAIL"]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown check error";
      setStatus("Compiler endpoint unavailable. Check network/server state and retry.");
      writeBlock(term, ["Terminal request failed:", message]);
    }

    setRunning(false);
  };

  const loadExercise = (nextIndex: number) => {
    const next = learnExercises[nextIndex];
    if (!next) return;
    setIndex(nextIndex);
    setCode(next.starterCode);
    setStatus(`Loaded ${next.title}.`);
    terminalShell.current?.clear();
  };

  const jumpToExercise = (nextIndex: number) => {
    loadExercise(nextIndex);
  };

  const nextExercise = () => {
    loadExercise((index + 1) % learnExercises.length);
  };

  const previousExercise = () => {
    loadExercise((index - 1 + learnExercises.length) % learnExercises.length);
  };

  const resetToStarter = () => {
    setCode(current.starterCode);
    terminalShell.current?.clear();
    setStatus(`Reset ${current.title} to starter code.`);
  };

  return (
    <main className="learn-shell">
      <header className="learn-topbar">
        <h1>Learn Beskid</h1>
        <p>
          Rustlings-style tour with Monaco + terminal + real `beskid` checks and a Codespace-ready
          curriculum directory.
        </p>
      </header>

      <section className="learn-toolbar">
        <div className="learn-toolbar-left">
          <button type="button" onClick={previousExercise}>
            Previous exercise
          </button>
          <button type="button" onClick={runChecks} disabled={running}>
            {running ? "Running..." : "Run checks"}
          </button>
          <button type="button" onClick={resetToStarter}>
            Reset starter
          </button>
          <button type="button" onClick={nextExercise}>
            Next exercise
          </button>
        </div>
        <div className="learn-toolbar-right">
          {index + 1}/{learnExercises.length} • Passed: {passedCount}
        </div>
      </section>

      <section className="learn-meta">
        <div>
          <strong>Lesson:</strong> {current.title}
        </div>
        <div>
          <strong>Difficulty:</strong> {current.difficulty}
        </div>
        <div className="learn-links">
          <a
            href={`https://github.com/Cyber-Nomad-Collective/beskid/blob/main${current.lessonPath}`}
            target="_blank"
            rel="noreferrer"
          >
            Open lesson in GitHub
          </a>
        </div>
      </section>

      <section className="learn-grid">
        <article className="learn-pane">
          <h2>{current.title}</h2>
          <p className="learn-objective">{current.objective}</p>
          <p className="learn-command">
            Suggested command: <code>beskid {current.command}</code>
          </p>
          <Editor
            height="46vh"
            defaultLanguage="beskid"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            onMount={handleLanguageReady}
            options={{
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
              minimap: { enabled: false },
              tabSize: 2,
            }}
          />
          <p className="learn-status">{status}</p>
          <p>
            <strong>Hints</strong>
          </p>
          <ul className="learn-hints">
            {current.hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </article>

        <article className="learn-side">
          <h2>Lesson map</h2>
          <ol className="lesson-list">
            {learnExercises.map((exercise, lessonIndex) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  className={lessonIndex === index ? "lesson-link lesson-link-active" : "lesson-link"}
                  onClick={() => jumpToExercise(lessonIndex)}
                  disabled={lessonIndex === index}
                >
                  <span>{exercise.title}</span>
                  <span>{passedLessons[exercise.id] ? "✓" : "○"}</span>
                </button>
              </li>
            ))}
          </ol>
          <h2>Terminal</h2>
          <div className="learn-terminal" ref={terminalRef} />
        </article>
      </section>
    </main>
  );
}

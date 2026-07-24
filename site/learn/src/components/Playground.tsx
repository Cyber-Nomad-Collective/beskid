import * as monacoEditor from "monaco-editor";
import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Button, Card, Badge } from "@beskid/ui-react";
import "xterm/css/xterm.css";

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
    .map((line) => label + " " + line);
}

function registerBeskidLanguage(monaco: typeof monacoEditor) {
  const languageId = "beskid";
  if (monaco.languages.getLanguages().some((lang) => lang.id === languageId)) {
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
        ["\\b(fn|pub|let|use|return|if|else|while|for|break|continue)\\b", "keyword"],
        ["\\b(i32|i64|u32|u64|f32|f64|string|bool|unit|true|false)\\b", "type"],
        ["//.*$", "comment"],
        ["\"(?:[^\\\"\\\\]|\\\\.)*\"", "string"],
        ["'[^']*'", "string"],
        ["[0-9]+", "number"],
      ],
    },
  });
}

interface PlaygroundProps {
  initialCode?: string;
}

export default function Playground({ initialCode = "" }: PlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);

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
    term.writeln("Beskid Playground terminal ready.");
    term.writeln('Type Beskid code and press "Run" to check with the compiler.');

    const resize = () => fitAddon.current.fit();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      term.dispose();
    };
  }, []);

  const handleLanguageReady = (
    editor: monacoEditor.editor.IStandaloneCodeEditor,
    monaco: typeof monacoEditor,
  ) => {
    registerBeskidLanguage(monaco);
    monaco.editor.setModelLanguage(editor.getModel()!, "beskid");
  };

  const runChecks = async () => {
    if (!terminalShell.current || running) {
      return;
    }
    setRunning(true);

    const term = terminalShell.current;
    term.clear();
    writeBlock(term, ["Running: analyze", "Mode: analyze (playground)"]);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: "playground",
          code,
          command: "analyze",
        }),
      });

      const result = (await response.json()) as CheckResponse;

      writeBlock(term, [
        "command: " + result.command,
        "exitCode: " + result.exitCode,
        "duration: " + result.durationMs + "ms",
      ]);

      if (typeof result.expectedOutput === "string") {
        writeBlock(term, [
          "expected output: " + JSON.stringify(result.expectedOutput),
          "matched: " + (result.expectedOutputMatched ? "yes" : "no"),
        ]);
      }

      writeBlock(term, parseMultiline(result.diagnosticsSummary, "[summary]"));
      writeBlock(term, parseMultiline(result.stdout, "[stdout]"));
      writeBlock(term, parseMultiline(result.stderr, "[stderr]"));
      writeBlock(term, ["-----"]);

      if (result.success) {
        writeBlock(term, ["Result: PASS"]);
      } else {
        writeBlock(
          term,
          result.error
            ? ["Check failed: " + result.error]
            : ["Result: FAIL"],
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown check error";
      writeBlock(term, ["Terminal request failed:", message]);
    }

    setRunning(false);
  };

  const clearOutput = () => {
    if (terminalShell.current) {
      terminalShell.current.clear();
      terminalShell.current.writeln("Beskid Playground terminal ready.");
      terminalShell.current.writeln(
        'Type Beskid code and press "Run" to check with the compiler.',
      );
    }
  };

  return (
    <Card className="playground">
      <div className="playground-toolbar">
        <div className="playground-toolbar-left">
          <Badge variant="outline">analyze</Badge>
          <Button onClick={runChecks} disabled={running} size="sm">
            {running ? "Running..." : "\u25b6 Run"}
          </Button>
          <Button onClick={clearOutput} variant="ghost" size="sm">
            Clear
          </Button>
        </div>
        <div className="playground-toolbar-right">
          <span className="playground-mode-label">Playground</span>
        </div>
      </div>

      <div className="playground-grid">
        <div className="playground-pane">
          <Editor
            height="100%"
            defaultLanguage="beskid"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            onMount={handleLanguageReady}
            options={{
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
              minimap: { enabled: false },
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="playground-terminal-pane">
          <div className="playground-terminal" ref={terminalRef} />
        </div>
      </div>
    </Card>
  );
}

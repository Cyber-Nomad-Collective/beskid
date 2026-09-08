import type * as monacoEditor from "monaco-editor";

const languageId = "beskid";
const markerOwner = "beskid-lsp";

type LspPosition = { line: number; character: number };
type LspRange = { start: LspPosition; end: LspPosition };
type LspCompletionItem = {
	label: string;
	kind?: number;
	detail?: string;
	documentation?: string | { value?: string };
	insertText?: string;
	textEdit?: { newText: string; range: LspRange };
};
type LspDiagnostic = { message: string; severity?: number; range: LspRange };

type MonacoPosition = { lineNumber: number; column: number };

function toMonacoRange(range: LspRange) {
	return {
		startLineNumber: range.start.line + 1,
		startColumn: range.start.character + 1,
		endLineNumber: range.end.line + 1,
		endColumn: range.end.character + 1,
	};
}

function diagnosticSeverity(severity?: number) {
	switch (severity) {
		case 2:
			return 4;
		case 3:
			return 2;
		case 4:
			return 1;
		default:
			return 8;
	}
}

export function toMonacoCompletionItems(
	items: LspCompletionItem[],
	position: MonacoPosition,
) {
	return items.map((item) => ({
		label: item.label,
		detail: item.detail,
		documentation:
			typeof item.documentation === "string"
				? item.documentation
				: item.documentation?.value,
		insertText: item.textEdit?.newText ?? item.insertText ?? item.label,
		kind: item.kind ?? 18,
		range: item.textEdit
			? toMonacoRange(item.textEdit.range)
			: {
					startLineNumber: position.lineNumber,
					startColumn: position.column,
					endLineNumber: position.lineNumber,
					endColumn: position.column,
				},
	}));
}

export function toMonacoDiagnosticMarkers(diagnostics: LspDiagnostic[]) {
	return diagnostics.map((diagnostic) => ({
		message: diagnostic.message,
		severity: diagnosticSeverity(diagnostic.severity),
		...toMonacoRange(diagnostic.range),
	}));
}

function websocketUrl() {
	const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${scheme}//${window.location.host}/api/lsp`;
}

function registerLanguage(monaco: typeof monacoEditor) {
	if (monaco.languages.getLanguages().some((language) => language.id === languageId)) {
		return;
	}

	monaco.languages.register({ id: languageId, aliases: ["Beskid"] });
	monaco.languages.setLanguageConfiguration(languageId, {
		comments: { lineComment: "//" },
		brackets: [["{", "}"], ["(", ")"], ["[", "]"]],
		autoClosingPairs: [
			{ open: "{", close: "}" },
			{ open: "(", close: ")" },
			{ open: "[", close: "]" },
		],
	});
	monaco.languages.setMonarchTokensProvider(languageId, {
		tokenizer: { root: [
			[/\b(unit|use|let|return|if|else|while|for|break|continue)\b/, "keyword"],
			[/\b(i32|i64|u32|u64|f32|f64|string|bool|true|false)\b/, "type"],
			[/\/\/.*$/, "comment"], [/(?:\").*?(?:\")/, "string"], [/[0-9]+/, "number"],
		] },
	});
}

export function registerBeskidLanguage(monaco: typeof monacoEditor) {
	registerLanguage(monaco);
}

export function attachBeskidLsp(
	editor: monacoEditor.editor.IStandaloneCodeEditor,
	monaco: typeof monacoEditor,
) {
	const model = editor.getModel();
	if (!model) return { dispose() {} };

	const socket = new WebSocket(websocketUrl());
	let requestId = 0;
	let version = model.getVersionId();
	let initialized = false;
	let changeTimer: ReturnType<typeof setTimeout> | undefined;
	const pending = new Map<number, (result: unknown) => void>();

	const notify = (method: string, params: unknown) => {
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
		}
	};
	const request = (method: string, params: unknown) => new Promise<unknown>((resolve) => {
		const id = ++requestId;
		pending.set(id, resolve);
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
		}
	});

	socket.addEventListener("open", () => {
		void request("initialize", {
			processId: null,
			rootUri: "file:///workspace",
			workspaceFolders: [{ uri: "file:///workspace", name: "workspace" }],
			capabilities: {},
		}).then(() => {
			initialized = true;
			notify("initialized", {});
			notify("textDocument/didOpen", {
				textDocument: { uri: model.uri.toString(), languageId, version, text: model.getValue() },
			});
		});
	});

	socket.addEventListener("message", (event) => {
		const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown; method?: string; params?: { diagnostics?: LspDiagnostic[] } };
		if (typeof message.id === "number") {
			const resolve = pending.get(message.id);
			pending.delete(message.id);
			resolve?.(message.result);
		}
		if (message.method === "textDocument/publishDiagnostics") {
			monaco.editor.setModelMarkers(model, markerOwner, toMonacoDiagnosticMarkers(message.params?.diagnostics ?? []) as monacoEditor.editor.IMarkerData[]);
		}
	});

	const completionProvider = monaco.languages.registerCompletionItemProvider(languageId, {
		triggerCharacters: [".", ":", "_"],
		provideCompletionItems(_currentModel, position) {
			return request("textDocument/completion", {
				textDocument: { uri: model.uri.toString() },
				position: { line: position.lineNumber - 1, character: position.column - 1 },
			}).then((result) => ({
				suggestions: toMonacoCompletionItems(
					(Array.isArray(result) ? result : (result as { items?: LspCompletionItem[] })?.items ?? []),
					position,
				) as monacoEditor.languages.CompletionItem[],
			}));
		},
	});

	const changeListener = model.onDidChangeContent(() => {
		version = model.getVersionId();
		clearTimeout(changeTimer);
		changeTimer = setTimeout(() => {
			if (initialized) {
				notify("textDocument/didChange", { textDocument: { uri: model.uri.toString(), version }, contentChanges: [{ text: model.getValue() }] });
			}
		}, 150);
	});

	return {
		dispose() {
			clearTimeout(changeTimer);
			changeListener.dispose();
			completionProvider.dispose();
			if (initialized) notify("textDocument/didClose", { textDocument: { uri: model.uri.toString() } });
			monaco.editor.setModelMarkers(model, markerOwner, []);
			socket.close();
		},
	};
}

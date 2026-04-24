import * as vscode from "vscode";

export function readPckgBaseUrl(): string {
  return (
    vscode.workspace.getConfiguration("beskid").get<string>("pckg.baseUrl") ??
    "http://localhost:5000"
  );
}

export function readLspLogLevel(): string {
  return (
    vscode.workspace.getConfiguration("beskid.lsp").get<string>("log.level", "info") ?? "info"
  );
}

export function readLogServerOutput(): boolean {
  return vscode.workspace.getConfiguration("beskid.lsp").get<boolean>("log.serverOutput", true);
}

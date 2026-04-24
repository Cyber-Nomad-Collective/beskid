import { dirname } from "node:path";
import * as vscode from "vscode";
import {
  Executable,
  LanguageClient,
  LanguageClientOptions,
} from "vscode-languageclient/node";
import { readLogServerOutput, readLspLogLevel } from "../config/workspaceSettings.js";
import { resolveBundledServerBinary } from "./serverBinary.js";

export function buildBeskidServerOptions(
  context: vscode.ExtensionContext,
  selectedProjectUri: vscode.Uri | undefined,
): { run: Executable; debug: Executable } {
  const config = vscode.workspace.getConfiguration("beskid.lsp");

  const configuredCwd = config.get<string>("server.cwd", "").trim();
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const projectRoot = selectedProjectUri ? dirname(selectedProjectUri.fsPath) : undefined;
  const cwd = configuredCwd.length > 0 ? configuredCwd : projectRoot ?? workspaceRoot;
  const options = cwd ? { cwd } : {};

  const bundledBinary = resolveBundledServerBinary(context);
  if (bundledBinary) {
    return {
      run: { command: bundledBinary, options },
      debug: { command: bundledBinary, options },
    };
  }

  const devMode = config.get<boolean>("server.devMode", false);
  if (!devMode) {
    const message =
      "Beskid LSP bundled binary was not found for this platform. " +
      "Enable 'beskid.lsp.server.devMode' to run from source (requires repo cloned), " +
      "or set 'beskid.lsp.server.path' to a local binary.";
    void vscode.window.showErrorMessage(message);
    throw new Error(message);
  }

  const command = config.get<string>("server.command", "cargo");
  const args = config.get<string[]>("server.args", ["run", "-p", "beskid_lsp"]);
  const debugArgs = config.get<string[]>("server.debugArgs", ["run", "-p", "beskid_lsp"]);

  return {
    run: { command, args, options },
    debug: { command, args: debugArgs, options },
  };
}

export function buildBeskidClientOptions(
  outputChannel: vscode.OutputChannel,
  selectedProjectUri: vscode.Uri | undefined,
): LanguageClientOptions {
  return {
    documentSelector: [
      { scheme: "file", language: "beskid", pattern: "**/*.bd" },
      { scheme: "file", language: "beskid-proj", pattern: "**/*.proj" },
    ],
    synchronize: {
      configurationSection: "beskid.lsp",
    },
    outputChannel,
    initializationOptions: {
      selectedProjectUri: selectedProjectUri?.toString(),
      logLevel: readLspLogLevel(),
      logServerOutput: readLogServerOutput(),
    },
  };
}

export function createBeskidLanguageClient(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
  selectedProjectUri: vscode.Uri | undefined,
): LanguageClient {
  return new LanguageClient(
    "beskidLanguageServer",
    "Beskid Language Server",
    buildBeskidServerOptions(context, selectedProjectUri),
    buildBeskidClientOptions(outputChannel, selectedProjectUri),
  );
}

export async function requestWorkspaceRefresh(client: LanguageClient | undefined): Promise<void> {
  if (!client) {
    return;
  }
  try {
    await client.sendRequest("workspace/executeCommand", {
      command: "beskid.refreshWorkspace",
      arguments: [],
    });
  } catch {
    // ignore if server isn't ready
  }
}

import * as vscode from "vscode";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  Executable,
  LanguageClient,
  LanguageClientOptions,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

function platformArchKey(): string | undefined {
  const platform = process.platform;
  const arch = process.arch;

  const normalizedPlatform =
    platform === "linux" || platform === "darwin" || platform === "win32"
      ? platform
      : undefined;
  const normalizedArch = arch === "x64" || arch === "arm64" ? arch : undefined;

  if (!normalizedPlatform || !normalizedArch) {
    return undefined;
  }

  return `${normalizedPlatform}-${normalizedArch}`;
}

function resolveBundledServerBinary(context: vscode.ExtensionContext): string | undefined {
  const config = vscode.workspace.getConfiguration("beskid.lsp");
  const explicitPath = config.get<string>("server.path", "").trim();
  if (explicitPath.length > 0) {
    return explicitPath;
  }

  if (!config.get<boolean>("server.preferBundled", true)) {
    return undefined;
  }

  const key = platformArchKey();
  if (!key) {
    return undefined;
  }

  const binaryName = process.platform === "win32" ? "beskid_lsp.exe" : "beskid_lsp";
  const bundledPath = join(context.extensionPath, "server", key, binaryName);
  return existsSync(bundledPath) ? bundledPath : undefined;
}

function serverOptionsFromConfig(context: vscode.ExtensionContext): { run: Executable; debug: Executable } {
  const config = vscode.workspace.getConfiguration("beskid.lsp");

  const configuredCwd = config.get<string>("server.cwd", "").trim();
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const cwd = configuredCwd.length > 0 ? configuredCwd : workspaceRoot;
  const options = cwd ? { cwd } : {};

  const bundledBinary = resolveBundledServerBinary(context);
  if (bundledBinary) {
    return {
      run: { command: bundledBinary, options },
      debug: { command: bundledBinary, options },
    };
  }

  const command = config.get<string>("server.command", "cargo");
  const args = config.get<string[]>("server.args", ["run", "-p", "beskid_lsp"]);
  const debugArgs = config.get<string[]>("server.debugArgs", args);

  return {
    run: { command, args, options },
    debug: { command, args: debugArgs, options },
  };
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const serverOptions = serverOptionsFromConfig(context);

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "beskid", pattern: "**/*.bd" },
      { scheme: "file", language: "beskid", pattern: "**/*.proj" },
    ],
    synchronize: {
      configurationSection: "beskid.lsp",
    },
    outputChannelName: "Beskid LSP",
  };

  client = new LanguageClient(
    "beskidLanguageServer",
    "Beskid Language Server",
    serverOptions,
    clientOptions,
  );

  await client.start();
}

export async function deactivate(): Promise<void> {
  if (!client) {
    return;
  }
  await client.stop();
  client = undefined;
}

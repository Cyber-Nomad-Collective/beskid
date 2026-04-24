import { existsSync } from "node:fs";
import { join } from "node:path";
import * as vscode from "vscode";

export function platformArchKey(): string | undefined {
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

export function resolveBundledServerBinary(context: vscode.ExtensionContext): string | undefined {
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

import * as vscode from "vscode";

export type BeskidCommandDeps = {
  selectProject: () => Promise<void>;
  quickActions: () => Promise<void>;
  startLsp: () => Promise<void>;
  stopLsp: () => Promise<void>;
  restartLsp: () => Promise<void>;
  packagesOpen: () => Promise<void>;
  packagesSearch: () => Promise<void>;
  openLogs: () => void;
};

export function registerBeskidCommands(context: vscode.ExtensionContext, deps: BeskidCommandDeps): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("beskid.selectProject", deps.selectProject),
    vscode.commands.registerCommand("beskid.lsp.quickActions", deps.quickActions),
    vscode.commands.registerCommand("beskid.lsp.start", deps.startLsp),
    vscode.commands.registerCommand("beskid.lsp.stop", deps.stopLsp),
    vscode.commands.registerCommand("beskid.lsp.restart", deps.restartLsp),
    vscode.commands.registerCommand("beskid.packages.open", deps.packagesOpen),
    vscode.commands.registerCommand("beskid.packages.search", deps.packagesSearch),
    vscode.commands.registerCommand("beskid.packages.openRegistryUri", async (uri: unknown) => {
      if (typeof uri !== "string" || (!uri.startsWith("http://") && !uri.startsWith("https://"))) {
        return;
      }
      await vscode.env.openExternal(vscode.Uri.parse(uri));
    }),
    vscode.commands.registerCommand("beskid.lsp.openLogs", deps.openLogs),
  );
}

import { dirname, relative } from "node:path";
import * as vscode from "vscode";
import { OutlineTreeItem } from "./OutlineTreeItem.js";

export class SelectedProjectOutlineProvider implements vscode.TreeDataProvider<OutlineTreeItem> {
  private readonly emitter = new vscode.EventEmitter<OutlineTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this.emitter.event;

  private selectedProjectUri: vscode.Uri | undefined;

  setProject(uri: vscode.Uri | undefined): void {
    this.selectedProjectUri = uri;
    this.refresh();
  }

  refresh(): void {
    this.emitter.fire();
  }

  async getChildren(element?: OutlineTreeItem): Promise<OutlineTreeItem[]> {
    if (!this.selectedProjectUri) {
      return [
        new OutlineTreeItem(
          "info",
          "Select a project from command palette.",
          vscode.TreeItemCollapsibleState.None,
        ),
      ];
    }

    if (!element) {
      const rootDir = dirname(this.selectedProjectUri.fsPath);
      const folder = vscode.workspace.workspaceFolders?.find((f) =>
        this.selectedProjectUri?.fsPath.startsWith(f.uri.fsPath),
      );
      const globBase =
        folder && rootDir.startsWith(folder.uri.fsPath)
          ? relative(folder.uri.fsPath, rootDir).replaceAll("\\", "/")
          : "";
      const pattern = new vscode.RelativePattern(
        folder?.uri ?? vscode.Uri.file(rootDir),
        `${globBase ? `${globBase}/` : ""}**/*.bd`,
      );
      const files = await vscode.workspace.findFiles(pattern, "**/target/**", 150);
      return files.map((uri) => {
        const file = new OutlineTreeItem(
          "file",
          vscode.workspace.asRelativePath(uri),
          vscode.TreeItemCollapsibleState.Collapsed,
          uri,
        );
        file.resourceUri = uri;
        file.command = {
          command: "vscode.open",
          title: "Open file",
          arguments: [uri],
        };
        return file;
      });
    }

    if (element.nodeType === "file" && element.uri) {
      const symbols =
        (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
          "vscode.executeDocumentSymbolProvider",
          element.uri,
        )) ?? [];
      return symbols.map((symbol) => this.symbolToItem(symbol, element.uri as vscode.Uri));
    }

    if (element.nodeType === "symbol" && element.symbol && element.uri) {
      return (element.symbol.children ?? []).map((child) =>
        this.symbolToItem(child, element.uri as vscode.Uri),
      );
    }

    return [];
  }

  getTreeItem(element: OutlineTreeItem): vscode.TreeItem {
    return element;
  }

  private symbolToItem(symbol: vscode.DocumentSymbol, uri: vscode.Uri): OutlineTreeItem {
    const item = new OutlineTreeItem(
      "symbol",
      symbol.name,
      symbol.children.length
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
      uri,
      symbol,
    );
    item.description = symbol.detail;
    item.command = {
      command: "vscode.open",
      title: "Reveal symbol",
      arguments: [uri, { selection: symbol.selectionRange }],
    };
    return item;
  }
}

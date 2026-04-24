import * as vscode from "vscode";

export class OutlineTreeItem extends vscode.TreeItem {
  constructor(
    readonly nodeType: "info" | "file" | "symbol",
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    readonly uri?: vscode.Uri,
    readonly symbol?: vscode.DocumentSymbol,
  ) {
    super(label, collapsibleState);
  }
}

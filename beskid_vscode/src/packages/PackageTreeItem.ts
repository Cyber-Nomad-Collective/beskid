import * as vscode from "vscode";

export class PackageTreeItem extends vscode.TreeItem {
  constructor(
    readonly nodeType: "info" | "package" | "detail",
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    readonly packageName?: string,
  ) {
    super(label, collapsibleState);
  }
}

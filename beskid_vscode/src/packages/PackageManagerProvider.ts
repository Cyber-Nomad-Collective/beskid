import * as vscode from "vscode";

export type PckgActivityPhase = "search" | "details";

export type PckgActivityReporter = (
  phase: PckgActivityPhase,
  active: boolean,
  detail?: string,
) => void;

interface PackageSummary {
  name: string;
  description?: string;
  category?: string;
}

interface SearchHit {
  package: PackageSummary;
}

export class PackageManagerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly emitter = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this.emitter.event;

  private searchQuery = "";

  constructor(
    private readonly getBaseUrl: () => string,
    private readonly reportActivity: PckgActivityReporter,
  ) {}

  setQuery(query: string): void {
    this.searchQuery = query;
    this.refresh();
  }

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(_element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const q = this.searchQuery.trim();
    if (!q) {
      const hint = new vscode.TreeItem(
        "Run “Beskid: Search Packages” to query the registry.",
        vscode.TreeItemCollapsibleState.None,
      );
      hint.iconPath = new vscode.ThemeIcon("info");
      return [hint];
    }

    const base = this.getBaseUrl().replace(/\/$/, "");
    const url = `${base}/api/search?q=${encodeURIComponent(q)}`;
    this.reportActivity("search", true, `Searching “${q}”…`);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        this.reportActivity("search", false);
        return [this.messageItem(`Registry returned HTTP ${res.status}.`, "error")];
      }
      const data: unknown = await res.json();
      this.reportActivity("search", false);
      if (!Array.isArray(data)) {
        return [this.messageItem("Unexpected response from registry.", "error")];
      }
      if (data.length === 0) {
        const empty = new vscode.TreeItem("No packages matched.", vscode.TreeItemCollapsibleState.None);
        empty.iconPath = new vscode.ThemeIcon("search-stop");
        return [empty];
      }
      return data.map((row) => {
        const hit = row as SearchHit;
        const name = hit.package?.name ?? "?";
        const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.None);
        item.description = hit.package?.category;
        item.tooltip = hit.package?.description?.trim() ? hit.package.description : name;
        item.iconPath = new vscode.ThemeIcon("package");
        const openUrl = `${base}/packages/${encodeURIComponent(name)}`;
        item.command = {
          command: "beskid.packages.openRegistryUri",
          title: "Open package in browser",
          arguments: [openUrl],
        };
        return item;
      });
    } catch (e) {
      this.reportActivity("search", false);
      const msg = e instanceof Error ? e.message : String(e);
      return [this.messageItem(msg, "error")];
    }
  }

  private messageItem(text: string, kind: "error" | "info"): vscode.TreeItem {
    const item = new vscode.TreeItem(text, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon(kind === "error" ? "error" : "info");
    return item;
  }
}

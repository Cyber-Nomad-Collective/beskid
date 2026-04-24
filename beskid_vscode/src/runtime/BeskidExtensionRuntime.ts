import * as vscode from "vscode";
import { NotificationType } from "vscode-languageserver-protocol";
import type { LanguageClient } from "vscode-languageclient/node";
import { SELECTED_PROJECT_KEY, WATCH_REFRESH_DEBOUNCE_MS } from "../constants.js";
import { readPckgBaseUrl } from "../config/workspaceSettings.js";
import { registerBeskidCommands } from "../commands/registerBeskidCommands.js";
import { createBeskidLanguageClient, requestWorkspaceRefresh } from "../lsp/beskidLanguageClient.js";
import { PackageManagerProvider } from "../packages/PackageManagerProvider.js";
import { SelectedProjectOutlineProvider } from "../outline/SelectedProjectOutlineProvider.js";
import { BeskidStatusController } from "../status/beskidStatusController.js";
import type { BeskidStatusParams } from "../status/beskidStatusTypes.js";

const BeskidStatusNotification = new NotificationType<BeskidStatusParams>("beskid/status");

export class BeskidExtensionRuntime {
  private client: LanguageClient | undefined;
  private readonly outputChannel: vscode.OutputChannel;
  private readonly statusBar: vscode.StatusBarItem;
  private readonly status: BeskidStatusController;
  private selectedProjectUri: vscode.Uri | undefined;
  private readonly packageProvider: PackageManagerProvider;
  private readonly outlineProvider: SelectedProjectOutlineProvider;
  private watcherRefreshTimer: NodeJS.Timeout | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel("Beskid LSP");
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBar.command = "beskid.lsp.quickActions";
    this.statusBar.show();
    this.status = new BeskidStatusController(this.statusBar);
    this.status.setLspClientRunning(false);

    this.selectedProjectUri = this.loadSelectedProject();
    this.packageProvider = new PackageManagerProvider(
      () => readPckgBaseUrl(),
      (phase, active, detail) => {
        if (phase === "search") {
          this.status.setPckgSearchActive(active, detail);
        } else {
          this.status.setPckgDetailsActive(active, detail);
        }
      },
    );
    this.outlineProvider = new SelectedProjectOutlineProvider();
    this.outlineProvider.setProject(this.selectedProjectUri);
  }

  async activate(): Promise<void> {
    this.context.subscriptions.push(this.outputChannel, this.statusBar);
    this.registerViews();
    registerBeskidCommands(this.context, {
      selectProject: async () => {
        await this.selectProject();
      },
      quickActions: async () => {
        await this.showQuickActions();
      },
      startLsp: async () => {
        await this.startClient();
      },
      stopLsp: async () => {
        await this.stopClient();
      },
      restartLsp: async () => {
        await this.restartClient();
      },
      packagesOpen: async () => {
        await vscode.commands.executeCommand("workbench.view.extension.beskidViews");
      },
      packagesSearch: async () => {
        const query = await vscode.window.showInputBox({
          prompt: "Search packages",
          placeHolder: "type package name/category...",
          value: "",
        });
        if (query !== undefined) {
          this.packageProvider.setQuery(query);
        }
      },
      openLogs: () => {
        this.outputChannel.show(true);
      },
    });
    this.registerWatchers();
    this.registerConfigurationHandlers();
    await this.startClient();
  }

  async deactivate(): Promise<void> {
    await this.stopClient();
  }

  private registerViews(): void {
    this.context.subscriptions.push(
      vscode.window.registerTreeDataProvider("beskidPackagesView", this.packageProvider),
      vscode.window.registerTreeDataProvider("beskidProjectOutlineView", this.outlineProvider),
    );
  }

  private registerWatchers(): void {
    const watcher = vscode.workspace.createFileSystemWatcher("**/*.{bd,proj}");
    const scheduleRefresh = () => {
      if (this.watcherRefreshTimer) {
        clearTimeout(this.watcherRefreshTimer);
      }
      this.watcherRefreshTimer = setTimeout(() => {
        void requestWorkspaceRefresh(this.client);
      }, WATCH_REFRESH_DEBOUNCE_MS);
    };
    watcher.onDidChange(scheduleRefresh, undefined, this.context.subscriptions);
    watcher.onDidCreate(scheduleRefresh, undefined, this.context.subscriptions);
    watcher.onDidDelete(scheduleRefresh, undefined, this.context.subscriptions);
    this.context.subscriptions.push(watcher);
  }

  private registerConfigurationHandlers(): void {
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (
          event.affectsConfiguration("beskid.lsp.server") ||
          event.affectsConfiguration("beskid.lsp.log.level")
        ) {
          await this.restartClient();
          return;
        }

        if (
          event.affectsConfiguration("beskid.pckg.baseUrl") ||
          event.affectsConfiguration("beskid.lsp.log.serverOutput")
        ) {
          this.packageProvider.refresh();
        }
      }),
    );
  }

  private loadSelectedProject(): vscode.Uri | undefined {
    const value = this.context.workspaceState.get<string>(SELECTED_PROJECT_KEY);
    if (!value) {
      return undefined;
    }
    try {
      return vscode.Uri.parse(value);
    } catch {
      return undefined;
    }
  }

  private async saveSelectedProject(uri: vscode.Uri | undefined): Promise<void> {
    this.selectedProjectUri = uri;
    if (!uri) {
      await this.context.workspaceState.update(SELECTED_PROJECT_KEY, undefined);
    } else {
      await this.context.workspaceState.update(SELECTED_PROJECT_KEY, uri.toString());
    }
    this.outlineProvider.setProject(uri);
  }

  private async showQuickActions(): Promise<void> {
    const actions: Array<{ label: string; command: string }> = [
      { label: "Start LSP", command: "beskid.lsp.start" },
      { label: "Stop LSP", command: "beskid.lsp.stop" },
      { label: "Restart LSP", command: "beskid.lsp.restart" },
      { label: "Open LSP Logs", command: "beskid.lsp.openLogs" },
      { label: "Refresh Workspace Diagnostics", command: "beskid.refreshWorkspace" },
    ];
    const selected = await vscode.window.showQuickPick(actions, {
      placeHolder: "Beskid quick actions",
    });
    if (!selected) {
      return;
    }
    if (selected.command === "beskid.refreshWorkspace") {
      await requestWorkspaceRefresh(this.client);
      return;
    }
    await vscode.commands.executeCommand(selected.command);
  }

  private async selectProject(): Promise<void> {
    const files = await vscode.workspace.findFiles("**/*.proj", "**/target/**", 300);
    if (files.length === 0) {
      void vscode.window.showWarningMessage("No .proj files found in workspace.");
      return;
    }

    const picks = files.map((uri) => ({
      label: vscode.workspace.asRelativePath(uri),
      uri,
      description: uri.fsPath,
    }));
    const selected = await vscode.window.showQuickPick(picks, {
      placeHolder: "Select Beskid project manifest",
    });
    if (!selected) {
      return;
    }

    await this.saveSelectedProject(selected.uri);
    await this.restartClient();
  }

  private registerBeskidStatusListener(client: LanguageClient): void {
    client.onNotification(BeskidStatusNotification, (params) => {
      this.status.applyLspNotification(params);
    });
  }

  private async startClient(): Promise<void> {
    if (this.client) {
      return;
    }
    const client = createBeskidLanguageClient(this.context, this.outputChannel, this.selectedProjectUri);
    this.registerBeskidStatusListener(client);
    this.client = client;
    await client.start();
    this.status.setLspClientRunning(true);
    await requestWorkspaceRefresh(this.client);
  }

  private async stopClient(): Promise<void> {
    if (!this.client) {
      return;
    }
    const current = this.client;
    this.client = undefined;
    await current.stop();
    this.status.setLspClientRunning(false);
  }

  private async restartClient(): Promise<void> {
    await this.stopClient();
    await this.startClient();
  }
}

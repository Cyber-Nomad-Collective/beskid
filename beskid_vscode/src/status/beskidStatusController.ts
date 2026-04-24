import * as vscode from "vscode";
import type { BeskidStatusParams } from "./beskidStatusTypes.js";

type LspScanState = {
  active: boolean;
  message?: string;
  current?: number;
  total?: number;
};

export class BeskidStatusController {
  private lspScan: LspScanState = { active: false };
  private pckgSearchActive = false;
  private pckgDetailsActive = false;
  private pckgMessage: string | undefined;
  private lspClientRunning = false;
  /** After the first successful start, show "Stopped" when the client is not running. */
  private lspStartedOnce = false;

  constructor(private readonly statusBar: vscode.StatusBarItem) {}

  setLspClientRunning(running: boolean): void {
    this.lspClientRunning = running;
    if (running) {
      this.lspStartedOnce = true;
    }
    this.render();
  }

  applyLspNotification(params: BeskidStatusParams): void {
    if (params.source !== "lsp") {
      return;
    }
    if (params.phase === "workspace_scan") {
      this.lspScan = {
        active: params.active,
        message: params.message,
        current: params.current,
        total: params.total,
      };
    } else if (!params.active) {
      this.lspScan = { active: false };
    }
    this.render();
  }

  setPckgSearchActive(active: boolean, detail?: string): void {
    this.pckgSearchActive = active;
    if (detail) {
      this.pckgMessage = detail;
    }
    this.render();
  }

  setPckgDetailsActive(active: boolean, detail?: string): void {
    this.pckgDetailsActive = active;
    if (detail) {
      this.pckgMessage = detail;
    }
    this.render();
  }

  private render(): void {
    const parts: string[] = [];

    if (this.lspScan.active) {
      const count =
        this.lspScan.current !== undefined && this.lspScan.total !== undefined
          ? `${this.lspScan.current}/${this.lspScan.total}`
          : "";
      const tail = [count, this.lspScan.message].filter(Boolean).join(" ");
      parts.push(`$(sync~spin) Scan${tail ? ` ${tail}` : ""}`);
    } else if (this.pckgDetailsActive || this.pckgSearchActive) {
      parts.push(`$(package) ${this.pckgMessage ?? "Packages…"}`);
    }

    if (this.lspClientRunning) {
      this.statusBar.text =
        parts.length > 0 ? `$(zap) Beskid: ${parts.join(" · ")}` : "$(zap) Beskid LSP: Running";
    } else if (!this.lspStartedOnce) {
      this.statusBar.text =
        parts.length > 0 ? `$(zap) Beskid: ${parts.join(" · ")}` : "$(zap) Beskid LSP";
    } else {
      this.statusBar.text =
        parts.length > 0
          ? `$(debug-stop) Beskid: ${parts.join(" · ")}`
          : "$(debug-stop) Beskid LSP: Stopped";
    }

    const tooltipLines = ["Beskid LSP quick actions (click)"];
    if (this.lspScan.active) {
      tooltipLines.push(`Workspace scan: ${this.lspScan.current ?? "?"}/${this.lspScan.total ?? "?"}`);
    }
    if (this.pckgSearchActive || this.pckgDetailsActive) {
      tooltipLines.push(this.pckgMessage ?? "Package manager activity");
    }
    this.statusBar.tooltip = tooltipLines.join("\n");
  }
}

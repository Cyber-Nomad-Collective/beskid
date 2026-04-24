import type { ExtensionContext } from "vscode";
import { BeskidExtensionRuntime } from "./runtime/BeskidExtensionRuntime.js";

let runtime: BeskidExtensionRuntime | undefined;

export async function activate(context: ExtensionContext): Promise<void> {
  runtime = new BeskidExtensionRuntime(context);
  await runtime.activate();
}

export async function deactivate(): Promise<void> {
  if (runtime) {
    await runtime.deactivate();
    runtime = undefined;
  }
}

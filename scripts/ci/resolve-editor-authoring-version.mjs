#!/usr/bin/env node
import { resolve } from "node:path";

import { resolveEditorAuthoringVersion } from "./editor-version.mjs";

const [repoRoot, vscodeRoot] = process.argv.slice(2);
if (!repoRoot || !vscodeRoot) {
  console.error("usage: resolve-editor-authoring-version.mjs <repo-root> <vscode-root>");
  process.exit(2);
}

try {
  console.log(resolveEditorAuthoringVersion(resolve(repoRoot, "editors", "zed"), resolve(vscodeRoot)));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

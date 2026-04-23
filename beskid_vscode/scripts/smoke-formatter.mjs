import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const extensionSource = readFileSync(join(root, "src", "extension.ts"), "utf8");

const formatterId =
  pkg?.contributes?.configurationDefaults?.["[beskid]"]?.["editor.defaultFormatter"];
if (formatterId !== "beskid.beskid-vscode") {
  throw new Error(
    `expected editor.defaultFormatter to be 'beskid.beskid-vscode', got ${String(formatterId)}`
  );
}

if (!extensionSource.includes("pattern: \"**/*.bd\"")) {
  throw new Error("expected extension client document selector to include .bd files");
}

console.log("formatter smoke check passed");

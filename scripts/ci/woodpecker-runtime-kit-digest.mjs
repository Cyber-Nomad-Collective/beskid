#!/usr/bin/env node
// Digest one ABI-v5 runtime kit directory.
//
//   woodpecker-runtime-kit-digest.mjs <runtime-kit-dir>                   prints the tree digest (0.5 evidence)
//   woodpecker-runtime-kit-digest.mjs <runtime-kit-dir> --receipt <path>  writes a canonical file-by-file receipt
//                                                                          and prints the SHA-256 of the receipt bytes
//
// The 0.6 schema-2 packet retains the receipt as `runtime-kit.json`; its byte digest is the
// `runtime_kit_sha256` of the build result, so the reader can verify the retained file directly.
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { relative, resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

export function RuntimeKitFiles(root) {
  if (!lstatSync(root).isDirectory()) throw new Error("runtime kit must be a directory");
  const files = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const full = join(path, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`runtime kit contains symlink: ${relative(root, full)}`);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(full);
      else throw new Error(`runtime kit contains unsupported entry: ${relative(root, full)}`);
    }
  }
  visit(root);
  if (files.length === 0) throw new Error("runtime kit is empty");
  return files;
}

export function RuntimeKitTreeDigest(root) {
  const hash = createHash("sha256");
  for (const file of RuntimeKitFiles(root)) {
    hash.update(relative(root, file).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function RuntimeKitReceiptBytes(root) {
  const files = RuntimeKitFiles(root).map(file => ({
    path: relative(root, file).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
  }));
  const receipt = { schema_version: 1, tree_sha256: RuntimeKitTreeDigest(root), files };
  return Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) try {
  if (![3, 5].includes(process.argv.length) || (process.argv.length === 5 && process.argv[3] !== "--receipt")) {
    throw new Error("usage: woodpecker-runtime-kit-digest.mjs <runtime-kit-dir> [--receipt <path>]");
  }
  const root = resolve(process.argv[2]);
  if (process.argv.length === 5) {
    const bytes = RuntimeKitReceiptBytes(root);
    writeFileSync(resolve(process.argv[4]), bytes, { flag: "wx" });
    process.stdout.write(`${createHash("sha256").update(bytes).digest("hex")}\n`);
  } else {
    process.stdout.write(`${RuntimeKitTreeDigest(root)}\n`);
  }
} catch (error) {
  process.stderr.write(`woodpecker runtime-kit digest: ${error.message}\n`);
  process.exit(1);
}

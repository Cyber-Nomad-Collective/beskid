#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve, join } from "node:path";

try {
  if (process.argv.length !== 3) throw new Error("usage: woodpecker-runtime-kit-digest.mjs <runtime-kit-dir>");
  const root = resolve(process.argv[2]);
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
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(relative(root, file).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  process.stdout.write(`${hash.digest("hex")}\n`);
} catch (error) {
  process.stderr.write(`woodpecker runtime-kit digest: ${error.message}\n`);
  process.exit(1);
}

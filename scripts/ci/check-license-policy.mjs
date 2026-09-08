#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

function parseRoot(args) {
  const rootIndex = args.indexOf("--root");
  if (rootIndex === -1) return process.cwd();
  if (!args[rootIndex + 1]) throw new Error("--root requires a directory");
  return resolve(args[rootIndex + 1]);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function validatePolicy(root) {
  const policyPath = resolve(root, "license-policy.json");
  const policy = readJson(policyPath);
  const errors = [];

  if (policy.schemaVersion !== 1) {
    errors.push(`license-policy.json: unsupported schemaVersion ${policy.schemaVersion}`);
  }

  for (const [spdx, relativePath] of Object.entries(policy.licenses ?? {})) {
    const licensePath = resolve(root, relativePath);
    if (!existsSync(licensePath) || statSync(licensePath).size === 0) {
      errors.push(`missing license text ${relativePath} for ${spdx}`);
    }
  }

  for (const entry of policy.packages ?? []) {
    const manifestPath = resolve(root, entry.path);
    if (!existsSync(manifestPath)) {
      errors.push(`${entry.path}: package manifest is missing`);
      continue;
    }
    const manifest = readJson(manifestPath);
    const actual = manifest.license ?? "<missing>";
    if (actual !== entry.license) {
      errors.push(`${entry.path}: expected ${entry.license}, found ${actual}`);
    }
  }

  return { errors, packageCount: (policy.packages ?? []).length };
}

try {
  const root = parseRoot(process.argv.slice(2));
  const result = validatePolicy(root);
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(error);
    process.exitCode = 1;
  } else {
    const noun = result.packageCount === 1 ? "package" : "packages";
    console.log(`license policy valid: ${result.packageCount} ${noun}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

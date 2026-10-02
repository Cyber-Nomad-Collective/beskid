#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseExactReleaseVersion } from "./release-version.mjs";

const HOLDS = new URL("./release-publication-holds.json", import.meta.url);
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;

function requireExactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} fields differ`);
  }
}

export function parsePublicationHolds(data) {
  let document;
  try {
    document = JSON.parse(data);
  } catch {
    throw new Error("publication hold data is not valid JSON");
  }
  requireExactKeys(document, ["schema_version", "holds"], "publication hold document");
  if (document.schema_version !== 1 || !Array.isArray(document.holds)) {
    throw new Error("unsupported publication hold document");
  }
  const keys = new Set();
  for (const [index, hold] of document.holds.entries()) {
    requireExactKeys(hold, ["version", "compiler_commit", "reason"], `publication hold ${index}`);
    parseExactReleaseVersion(hold.version);
    if (!COMMIT_PATTERN.test(hold.compiler_commit)) {
      throw new Error(`publication hold ${index} has an invalid compiler commit`);
    }
    if (typeof hold.reason !== "string" || !hold.reason.trim() || hold.reason.length > 1000 || /[\u0000-\u001f\u007f]/.test(hold.reason)) {
      throw new Error(`publication hold ${index} has an invalid reason`);
    }
    const key = `${hold.version}\u0000${hold.compiler_commit}`;
    if (keys.has(key)) throw new Error(`duplicate publication hold for ${hold.version} ${hold.compiler_commit}`);
    keys.add(key);
  }
  return document.holds;
}

export function checkSource(version, compilerCommit, holds) {
  parseExactReleaseVersion(version);
  if (!COMMIT_PATTERN.test(compilerCommit)) throw new Error("compiler commit must be exactly 40 lowercase hexadecimal characters");
  const hold = holds.find(item => item.version === version && item.compiler_commit === compilerCommit);
  if (hold) throw new Error(`publication hold for ${version} ${compilerCommit}: ${hold.reason}`);
}

function main(argv) {
  if (argv.length !== 3 || argv[0] !== "check-source") {
    throw new Error("usage: release-publication-eligibility.mjs check-source <version> <compiler-sha>");
  }
  const holds = parsePublicationHolds(readFileSync(HOLDS, "utf8"));
  checkSource(argv[1], argv[2], holds);
  console.log(`publication source is not explicitly held: ${argv[1]} ${argv[2]}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "publication source check failed");
    process.exit(1);
  }
}

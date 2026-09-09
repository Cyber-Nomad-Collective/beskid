#!/usr/bin/env node
import { pathToFileURL } from "node:url";

export const EXACT_SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function parseExactReleaseVersion(raw, { stableOnly = false } = {}) {
  const version = String(raw);
  const releaseWithoutBuild = version.split("+", 1)[0];
  if (!EXACT_SEMVER_PATTERN.test(version) || (stableOnly && releaseWithoutBuild.includes("-"))) {
    throw new Error(`release version must be an exact${stableOnly ? " stable" : ""} semantic version, got ${raw}`);
  }
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [version, option] = process.argv.slice(2);
    if (!version || (option && option !== "--stable-only")) {
      throw new Error("usage: release-version.mjs <version> [--stable-only]");
    }
    console.log(parseExactReleaseVersion(version, { stableOnly: option === "--stable-only" }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

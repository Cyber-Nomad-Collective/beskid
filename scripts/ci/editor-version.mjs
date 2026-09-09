import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseExactReleaseVersion } from "./release-version.mjs";

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${path}: invalid JSON: ${error.message}`);
  }
}

function tomlVersion(path, expectedSection) {
  const content = readFileSync(path, "utf8");
  const versions = [];
  let section = null;
  for (const line of content.split(/\r?\n/)) {
    const header = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (header) {
      section = header[1];
      continue;
    }
    const version = line.match(/^\s*version\s*=\s*"([^"]+)"\s*$/);
    if (version && section === expectedSection) versions.push(version[1]);
  }
  const label = expectedSection === null ? "top-level" : `[${expectedSection}]`;
  if (versions.length !== 1) fail(`${path}: expected exactly one ${label} version field`);
  return versions[0];
}

export function resolveEditorAuthoringVersion(zedRoot, vscodeRoot) {
  const extensionVersion = tomlVersion(join(zedRoot, "extension.toml"), null);
  const cargoVersion = tomlVersion(join(zedRoot, "Cargo.toml"), "package");
  const packageJson = readJson(join(vscodeRoot, "package.json"));
  const packageLock = readJson(join(vscodeRoot, "package-lock.json"));
  const versions = [
    extensionVersion,
    cargoVersion,
    packageJson.version,
    packageLock.version,
    packageLock.packages?.[""]?.version,
  ];
  for (const version of versions) parseExactReleaseVersion(version, { stableOnly: true });
  if (new Set(versions).size !== 1) {
    fail(
      `editor authoring versions must agree: extension.toml=${extensionVersion}, ` +
        `Cargo.toml=${cargoVersion}, package.json=${packageJson.version}, ` +
        `package-lock.json=${packageLock.version}, ` +
        `package-lock.json#packages[""]=${packageLock.packages?.[""]?.version}`,
    );
  }
  return extensionVersion;
}

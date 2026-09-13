#!/usr/bin/env node
/**
 * Validate provider-independent evidence for one stable three-platform release.
 *
 * Usage: node scripts/ci/woodpecker-release-evidence.mjs <evidence-directory>
 *
 * Directory schema:
 *   <root>/<linux|macos|windows>/woodpecker-build-result.json
 *   <root>/<linux|macos|windows>/platform-result-<target>.json
 *   <root>/<linux|macos|windows>/SHA256SUMS
 *   <root>/<linux|macos|windows>/<CLI, LSP, and bundle artifacts>
 *
 */
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PLATFORMS = [
  {
    platform: "linux",
    target: "x86_64-unknown-linux-gnu",
    cli: "beskid-linux-amd64",
    lsp: "beskid_lsp-linux-amd64",
  },
  {
    platform: "macos",
    target: "aarch64-apple-darwin",
    cli: "beskid-darwin-arm64",
    lsp: "beskid_lsp-darwin-arm64",
  },
  {
    platform: "windows",
    target: "x86_64-pc-windows-msvc",
    cli: "beskid-windows-amd64.exe",
    lsp: "beskid_lsp-windows-amd64.exe",
  },
];
const STABLE_SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const GIT_COMMIT = /^[0-9a-f]{40}$/;

function fail(message) {
  throw new Error(message);
}

function requireDirectory(path, label) {
  let stats;
  try {
    stats = lstatSync(path);
  } catch {
    fail(`${label} is missing`);
  }
  if (stats.isSymbolicLink()) fail(`${label} must not be a symbolic link`);
  if (!stats.isDirectory()) fail(`${label} must be a directory`);
}

function requireRegularFile(path, label) {
  let stats;
  try {
    stats = lstatSync(path);
  } catch {
    fail(`${label} is missing`);
  }
  if (stats.isSymbolicLink()) fail(`${label} must not be a symbolic link`);
  if (!stats.isFile()) fail(`${label} must be a regular file`);
}

function readJson(path, label) {
  requireRegularFile(path, label);
  let value;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label} is missing or invalid JSON: ${error.message}`);
  }
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} must be a JSON object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${label} must be a non-empty string`);
  }
  return value;
}

function requireCommit(value, label) {
  const commit = requireString(value, label);
  if (!GIT_COMMIT.test(commit)) {
    fail(`${label} must be a lowercase 40-character hexadecimal Git commit`);
  }
  return commit;
}

function readSource(value, label) {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} must be an object`);
  }
  return {
    superrepo_commit: requireCommit(value.superrepo_commit, `${label}.superrepo_commit`),
    compiler_commit: requireCommit(value.compiler_commit, `${label}.compiler_commit`),
  };
}

function sameSource(actual, expected, label, expectedLabel) {
  for (const field of ["superrepo_commit", "compiler_commit"]) {
    if (actual[field] !== expected[field]) {
      fail(`${label}.${field} does not match ${expectedLabel}`);
    }
  }
}

function readChecksums(path, platform, expectedNames) {
  requireRegularFile(path, `${platform} SHA256SUMS`);
  let contents;
  try {
    contents = readFileSync(path, "utf8");
  } catch (error) {
    fail(`${platform} SHA256SUMS cannot be read: ${error.message}`);
  }
  const checksums = new Map();
  for (const line of contents.split(/\r?\n/)) {
    if (line.length === 0) continue;
    const match = /^([a-fA-F0-9]{64}) (?: |\*)([^/\\]+)$/.exec(line);
    if (!match) fail(`${platform} SHA256SUMS has malformed entry: ${line}`);
    const [, digest, name] = match;
    if (!expectedNames.includes(name)) fail(`${platform} SHA256SUMS has undeclared checksum ${name}`);
    if (checksums.has(name)) fail(`${platform} SHA256SUMS repeats ${name}`);
    checksums.set(name, digest.toLowerCase());
  }
  for (const name of expectedNames) {
    if (!checksums.has(name)) fail(`${platform} SHA256SUMS is missing ${name}`);
  }
  return checksums;
}

function checksumFile(directory, platform, name, checksums) {
  const path = join(directory, name);
  let stats;
  try {
    stats = lstatSync(path);
  } catch {
    fail(`${platform} missing required artifact ${name}`);
  }
  if (stats.isSymbolicLink()) fail(`${platform} artifact ${name} must not be a symbolic link`);
  if (!stats.isFile()) fail(`${platform} missing required artifact ${name}`);
  const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (digest !== checksums.get(name)) fail(`${platform} checksum mismatch for ${name}`);
  return { name, sha256: digest };
}

function exactKeys(value, expected, label) {
  const keys = Object.keys(value).sort();
  const required = [...expected].sort();
  if (keys.length !== required.length || keys.some((key, index) => key !== required[index])) {
    fail(`${label} must contain exactly ${required.join(", ")}`);
  }
}

function validatePlatform(root, definition, expectedSource, expectedVersion) {
  const directory = join(root, definition.platform);
  requireDirectory(directory, `${definition.platform} platform directory`);
  const resultName = `platform-result-${definition.target}.json`;
  const bundle = `beskid-${expectedVersion}-${definition.target}.tar.gz`;
  const expectedArtifacts = [definition.cli, definition.lsp, bundle, resultName, "woodpecker-build-result.json"];
  const buildResult = readJson(join(directory, "woodpecker-build-result.json"), `${definition.platform} build result`);
  if (buildResult.schema_version !== 1) fail(`${definition.platform} build result schema_version must be 1`);
  if (buildResult.platform !== definition.platform) fail(`${definition.platform} build result platform does not match directory`);
  if (buildResult.target !== definition.target) fail(`${definition.platform} build result target does not match expected target`);
  if (buildResult.channel !== "stable") fail(`${definition.platform} build result channel must be stable`);
  if (buildResult.platform_result_status !== "success") fail(`${definition.platform} build result platform_result_status must be success`);
  if (buildResult.published !== false) fail(`${definition.platform} build result published must be false`);
  const source = readSource(buildResult.source, `${definition.platform} source`);
  sameSource(source, expectedSource, `${definition.platform} source`, "linux");
  if (buildResult.version !== expectedVersion) fail(`${definition.platform} version does not match linux`);

  const platformResult = readJson(join(directory, resultName), `${definition.platform} platform result`);
  if (platformResult.schema_version !== 1) fail(`${definition.platform} platform result schema_version must be 1`);
  if (platformResult.target !== definition.target) fail(`${definition.platform} platform result target does not match expected target`);
  if (platformResult.stage !== "native-release-build") fail(`${definition.platform} platform result stage must be native-release-build`);
  if (!Array.isArray(platformResult.diagnostics) || platformResult.diagnostics.length !== 0) {
    fail(`${definition.platform} platform result diagnostics must be an empty array`);
  }
  if (platformResult.builds === null || Array.isArray(platformResult.builds) || typeof platformResult.builds !== "object") {
    fail(`${definition.platform} platform result builds must be an object`);
  }
  exactKeys(platformResult.builds, ["bundle", "cli", "lsp"], `${definition.platform} platform result builds`);
  const expectedBuildAssets = { cli: definition.cli, lsp: definition.lsp, bundle };
  for (const [name, expectedAsset] of Object.entries(expectedBuildAssets)) {
    const build = platformResult.builds[name];
    if (build === null || Array.isArray(build) || typeof build !== "object") fail(`${definition.platform} ${name} build must be an object`);
    if (build.status !== "success") fail(`${definition.platform} ${name} build must have status success`);
    if (build.asset !== expectedAsset) fail(`${definition.platform} ${name} build asset does not match expected artifact`);
  }

  const checksums = readChecksums(join(directory, "SHA256SUMS"), definition.platform, expectedArtifacts);
  return {
    platform: definition.platform,
    target: definition.target,
    artifacts: expectedArtifacts.map((name) => checksumFile(directory, definition.platform, name, checksums)),
  };
}

function validate(root, selectedPlatform) {
  const resolvedRoot = resolve(root);
  requireDirectory(resolvedRoot, "evidence directory");
  const selected = selectedPlatform ? PLATFORMS.filter(item => item.platform === selectedPlatform) : PLATFORMS;
  if (selected.length === 0) fail("unsupported platform");
  const linux = readJson(join(resolvedRoot, selected[0].platform, "woodpecker-build-result.json"), `${selected[0].platform} build result`);
  if (linux.schema_version !== 1) fail("linux build result schema_version must be 1");
  const source = readSource(linux.source, "linux source");
  const version = requireString(linux.version, "linux version");
  if (!STABLE_SEMVER.test(version)) fail("linux version must be a stable semantic version");
  const platforms = selected.map((definition) => validatePlatform(resolvedRoot, definition, source, version));
  return { schema_version: 1, version, source, platforms };
}

function usage() {
  return "usage: woodpecker-release-evidence.mjs <evidence-directory> [linux|macos|windows]";
}

if (![3, 4].includes(process.argv.length) || process.argv[2] === "--help") {
  process.stderr.write(`${usage()}\n`);
  process.exit(process.argv[2] === "--help" ? 0 : 2);
}

try {
  process.stdout.write(`${JSON.stringify(validate(process.argv[2], process.argv[3]), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`woodpecker release evidence: ${error.message}\n`);
  process.exit(1);
}

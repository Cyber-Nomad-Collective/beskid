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
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const SHA256 = /^[a-f0-9]{64}$/;
const FEATURE_CASES = [
  { id: "foundations.core_bytes", target: "CoreBytesTests" },
  { id: "foundations.encoding_utf8", target: "CoreEncodingUtf8Tests" },
  { id: "foundations.time", target: "SystemTimeTests" },
  { id: "foundations.fibers", target: "ConcurrencyFiberHandleTests" },
  { id: "foundations.channels", target: "ConcurrencyChannelApiTests" },
  { id: "network.types", target: "NetworkTypesTests" },
  { id: "network.dns", target: "NetworkDnsTests" },
  { id: "network.tcp", target: "NetworkTcpTests" },
  { id: "network.udp", target: "NetworkUdpTests" },
  { id: "network.scope", target: "NetworkScopeTests" },
  { id: "network.shutdown", target: "NetworkShutdownLeakTests" },
  { id: "network.disposable", target: "NetworkDisposableTests" },
  { id: "http.codec", target: "HttpCodecTests" },
  { id: "http.validation", target: "HttpValidationTests" },
  { id: "http.serialization", target: "HttpSerializationTests" },
  { id: "http.exchange", target: "HttpExchangeTests" },
];
const GLUE_NOT_APPLICABLE_REASON = "Glue bindings are outside the v0.5 release contract; generated Rust/.NET bindings remain deferred to v0.6.";
const scripts = dirname(fileURLToPath(import.meta.url));

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

function featureLogName(id) {
  return `feature-${id.replaceAll(".", "-")}.json`;
}

function validateFeatures(directory, definition, expectedSource, expectedVersion, buildResult, checksums) {
  const featureName = "feature-evidence-v1.json";
  const feature = readJson(join(directory, featureName), `${definition.platform} feature evidence`);
  exactKeys(feature, ["schema_version", "platform", "target", "version", "source", "runtime_kit", "cases", "not_applicable"], `${definition.platform} feature evidence`);
  if (feature.schema_version !== 1) fail(`${definition.platform} feature evidence schema_version must be 1`);
  if (feature.platform !== definition.platform) fail(`${definition.platform} feature evidence platform does not match`);
  if (feature.target !== definition.target) fail(`${definition.platform} feature evidence target does not match`);
  if (feature.version !== expectedVersion) fail(`${definition.platform} feature evidence version does not match`);
  const source = readSource(feature.source, `${definition.platform} feature source`);
  sameSource(source, expectedSource, `${definition.platform} feature source`, "linux");

  const kit = feature.runtime_kit;
  if (kit === null || Array.isArray(kit) || typeof kit !== "object") fail(`${definition.platform} runtime_kit must be an object`);
  exactKeys(kit, ["profile", "target", "sha256", "abi_sha256"], `${definition.platform} runtime_kit`);
  if (kit.profile !== "release") fail(`${definition.platform} runtime kit profile must be release`);
  if (kit.target !== definition.target) fail(`${definition.platform} runtime kit target does not match`);
  if (!SHA256.test(kit.sha256) || !SHA256.test(kit.abi_sha256)) fail(`${definition.platform} runtime-kit digests must be lowercase SHA-256 hashes`);
  if (buildResult.runtime_kit_sha256 !== kit.sha256) fail(`${definition.platform} runtime-kit digest does not match build result`);

  if (!Array.isArray(feature.cases)) fail(`${definition.platform} feature cases must be an array`);
  const byId = new Map();
  for (const item of feature.cases) {
    if (item === null || Array.isArray(item) || typeof item !== "object") fail(`${definition.platform} feature case must be an object`);
    exactKeys(item, ["id", "target", "status", "log", "log_sha256", "test_ids"], `${definition.platform} feature case`);
    if (byId.has(item.id)) fail(`${definition.platform} repeats feature case ${item.id}`);
    byId.set(item.id, item);
  }
  for (const required of FEATURE_CASES) {
    const item = byId.get(required.id);
    if (!item) fail(`${definition.platform} missing required conformance cases: ${required.id}`);
    if (item.target !== required.target) fail(`${definition.platform} ${required.id} target does not match`);
    if (item.status !== "success") fail(`${definition.platform} ${required.id} did not succeed`);
    const expectedLog = featureLogName(required.id);
    if (item.log !== expectedLog) fail(`${definition.platform} ${required.id} log name does not match`);
    if (!Array.isArray(item.test_ids) || item.test_ids.length === 0 || item.test_ids.some(id => typeof id !== "string" || id.length === 0) || new Set(item.test_ids).size !== item.test_ids.length) {
      fail(`${definition.platform} ${required.id} has no unique executed test IDs`);
    }
    if (!SHA256.test(item.log_sha256)) fail(`${definition.platform} ${required.id} log digest must be a lowercase SHA-256 hash`);
    if (checksums.get(expectedLog) !== item.log_sha256) fail(`${definition.platform} ${expectedLog} checksum mismatch`);
    const log = readJson(join(directory, expectedLog), `${definition.platform} ${expectedLog}`);
    if (log.target !== required.target || !Array.isArray(log.tests)) fail(`${definition.platform} ${required.id} log target or tests are invalid`);
    if (log.summary === null || Array.isArray(log.summary) || typeof log.summary !== "object") fail(`${definition.platform} ${required.id} summary is missing or invalid`);
    const outcomes = { passed: 0, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 };
    for (const test of log.tests) {
      if (test === null || Array.isArray(test) || typeof test !== "object" || !Object.hasOwn(outcomes, test.outcome) || typeof test.qualified_name !== "string" || test.qualified_name.length === 0) {
        fail(`${definition.platform} ${required.id} contains an invalid test record`);
      }
      outcomes[test.outcome] += 1;
    }
    exactKeys(log.summary, Object.keys(outcomes), `${definition.platform} ${required.id} summary`);
    for (const [name, count] of Object.entries(outcomes)) {
      if (!Number.isSafeInteger(log.summary[name]) || log.summary[name] < 0 || log.summary[name] !== count) fail(`${definition.platform} ${required.id} summary counts do not match tests`);
    }
    const passed = log.tests.filter(test => test.outcome === "passed").map(test => test.qualified_name);
    if (log.tests.length === 0 || outcomes.passed === 0 || outcomes.failed + outcomes.skipped + outcomes.filtered_out + outcomes.timed_out > 0) {
      fail(`${definition.platform} ${required.id} contains skipped, filtered, timed-out, or failed tests`);
    }
    if (JSON.stringify([...passed].sort()) !== JSON.stringify([...item.test_ids].sort())) fail(`${definition.platform} ${required.id} executed test IDs do not match its log`);
  }
  if (byId.size !== FEATURE_CASES.length) fail(`${definition.platform} feature cases contain undeclared conformance IDs`);

  const glue = feature.not_applicable?.glue;
  if (feature.not_applicable === null || Array.isArray(feature.not_applicable) || typeof feature.not_applicable !== "object") fail(`${definition.platform} not_applicable must be an object`);
  exactKeys(feature.not_applicable, ["glue"], `${definition.platform} not_applicable`);
  if (glue === null || Array.isArray(glue) || typeof glue !== "object") fail(`${definition.platform} Glue status must be an object`);
  exactKeys(glue, ["status", "reason"], `${definition.platform} Glue status`);
  if (glue.status !== "not_applicable" || glue.reason !== GLUE_NOT_APPLICABLE_REASON) fail(`${definition.platform} Glue not_applicable reason does not match the v0.5 scope`);

  return {
    runtime_kit: kit,
    cases: FEATURE_CASES.map(({ id }) => {
      const item = byId.get(id);
      return { id, target: item.target, status: item.status, log: item.log, log_sha256: item.log_sha256, test_ids: item.test_ids };
    }),
    not_applicable: feature.not_applicable,
    artifacts: [featureName, ...FEATURE_CASES.map(({ id }) => featureLogName(id))].map(name => ({ name, sha256: checksums.get(name) })),
  };
}

function validatePlatform(root, definition, expectedSource, expectedVersion) {
  const directory = join(root, definition.platform);
  requireDirectory(directory, `${definition.platform} platform directory`);
  const resultName = `platform-result-${definition.target}.json`;
  const bundle = `beskid-${expectedVersion}-${definition.target}.tar.gz`;
  const expectedArtifacts = [definition.cli, definition.lsp, bundle, resultName, "woodpecker-build-result.json", "feature-evidence-v1.json", ...FEATURE_CASES.map(({ id }) => featureLogName(id))];
  if (definition.platform === "linux") expectedArtifacts.push("cli-surface-evidence-v1.json", "cli-surface-receipt-v1.json");
  const buildResult = readJson(join(directory, "woodpecker-build-result.json"), `${definition.platform} build result`);
  if (buildResult.schema_version !== 1) fail(`${definition.platform} build result schema_version must be 1`);
  if (buildResult.platform !== definition.platform) fail(`${definition.platform} build result platform does not match directory`);
  if (buildResult.target !== definition.target) fail(`${definition.platform} build result target does not match expected target`);
  if (buildResult.channel !== "stable") fail(`${definition.platform} build result channel must be stable`);
  if (buildResult.platform_result_status !== "success") fail(`${definition.platform} build result platform_result_status must be success`);
  if (buildResult.published !== false) fail(`${definition.platform} build result published must be false`);
  if (typeof buildResult.runtime_kit_sha256 !== "string" || !SHA256.test(buildResult.runtime_kit_sha256)) fail(`${definition.platform} build result runtime_kit_sha256 must be a lowercase SHA-256 hash`);
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
  const features = validateFeatures(directory, definition, expectedSource, expectedVersion, buildResult, checksums);
  const artifacts = expectedArtifacts.map((name) => checksumFile(directory, definition.platform, name, checksums));
  if (definition.platform === "linux") {
    if (!SHA256.test(buildResult.corelib_fingerprint)) fail("linux build result Corelib fingerprint must be SHA-256");
    const cli = spawnSync(process.execPath, [join(scripts, "woodpecker-cli-surface-evidence.mjs"), "validate",
      directory, expectedVersion, source.superrepo_commit, source.compiler_commit,
      buildResult.runtime_kit_sha256, buildResult.corelib_fingerprint], { encoding: "utf8" });
    if (cli.error || cli.status !== 0) fail(`linux CLI surface receipt failed: ${cli.error?.message || cli.stderr.trim()}`);
  }
  return {
    platform: definition.platform,
    target: definition.target,
    features,
    artifacts,
  };
}

export function ValidateReleaseEvidence(root, selectedPlatform) {
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (![3, 4].includes(process.argv.length) || process.argv[2] === "--help") {
    process.stderr.write(`${usage()}\n`);
    process.exit(process.argv[2] === "--help" ? 0 : 2);
  }
  try {
    process.stdout.write(`${JSON.stringify(ValidateReleaseEvidence(process.argv[2], process.argv[3]), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`woodpecker release evidence: ${error.message}\n`);
    process.exit(1);
  }
}

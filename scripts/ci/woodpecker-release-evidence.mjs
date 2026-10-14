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
import { lstatSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  CORELIB_FINGERPRINT_FILE, EXECUTION_KINDS, FEATURE_FILE, HARNESS_LANGUAGES, INSTALLED_RECEIPT, INVOCATION_LINE, MANIFEST_FILE,
  ManifestDigest, OUTPUT_LIMIT, ParseCanonicalManifest, RUNTIME_ABI_RECEIPT, RUNTIME_KIT_RECEIPT, caseLogName, caseStderrName,
  caseStdoutName, checkProvenance, confinedRelativePath, fixturePacketName, harnessPacketName, inputPacketName, libtestOutcome, libtestPath,
  nativeReportOutcomes, packetName, parseSections, samePathSegments, sourcePacketName, substituteTemplate,
} from "./release-case-common.mjs";

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
// Reviewed source manifest identity: update only alongside reviewed real bindings.
const V06_CASE_MANIFEST_SHA256 = "637ebcf64848e2aba6b1181d15ceba8e867a47e52023713191a7ff6c6340ad19";

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

const equalValue = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label} does not match frozen expected identity`);
};
function checkedPacketFile(expected, reference, label) {
  if (!reference || !SHA256.test(reference.sha256)) fail(`${label} digest is invalid`);
  const name = packetName(reference.path);
  if (expected.packet_files[name] !== reference.sha256) fail(`${label} digest does not match retained packet closure`);
  const path = join(expected.packet_root, name);
  requireRegularFile(path, `${label} packet file`);
  const bytes = readFileSync(path);
  if (createHash("sha256").update(bytes).digest("hex") !== reference.sha256) fail(`${label} packet file digest mismatch`);
  return bytes;
}
function allowedKeys(value, required, optional, label) {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  const keys = Object.keys(value);
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${label} is missing ${key}`);
  for (const key of keys) if (!required.includes(key) && !optional.includes(key)) fail(`${label} has undeclared field ${key}`);
}
const MANIFEST_KEYS = ["schema_version", "release_series", "state", "targets", "normative_source", "policy", "execution_kinds", "rust_profile",
  "required_obligations", "harness_executables", "fixture_executables", "packet_files", "target_packet_files", "cases", "provisional_cases"];
const CASE_KEYS = ["id", "requirement_ids", "spec_change", "obligation", "execution", "binding"];
const BINDING_COMMON = ["harness_language", "harness_source", "source_file", "required_test_ids", "command", "input", "fixture",
  "assertion_provenance", "reviewed_source_binding", "log"];
const BINDING_OPTIONAL = ["related_evidence", "profile_assertions", "obligation_assertions"];
const BINDING_KEYS = { installed_native: [...BINDING_COMMON, "target", "project"], installed_host_harness: [...BINDING_COMMON, "harness"] };
const ROW_KEYS = ["id", "requirement_ids", "status", "exit_code", "timed_out", "source", "target", "runtime_kit_sha256", "candidate_cli_sha256",
  "candidate_bundle_sha256", "harness_source", "command", "input_sha256", "artifact", "artifact_sha256", "stdout", "stdout_sha256", "stderr",
  "stderr_sha256", "tests", "log", "log_sha256"];
const COMMAND_KEYS = ["argv", "tool_file", "tool_sha256", "version", "installed_cli", "env"];
const RECEIPT_KEYS = ["prefix", "target", "source", "version", "runtime_kit_sha256", "abi_sha256", "bundle_sha256", "corelib_fingerprint", "cli", "files"];
const FEATURE_KEYS = ["schema_version", "version", "target", "source", "case_manifest_sha256", "runtime_kit", "installed_prefix", "cases",
  "rust_profile_matrix", "obligation_matrix", "not_applicable"];
const OBLIGATION_KINDS = ["ownership", "failure", "process"];

/** Compare one resolved command against its frozen template: path-valued templates compare by segments. */
function commandMatches(template, actual, values, label) {
  allowedKeys(actual, COMMAND_KEYS, [], `${label} command`);
  if (!Array.isArray(template.argv) || !Array.isArray(actual.argv) || template.argv.length !== actual.argv.length
      || !actual.argv.every(argument => typeof argument === "string")) fail(`${label} command argv does not match frozen template`);
  const compare = (templateText, actualText, field) => {
    if (typeof actualText !== "string" || actualText.length === 0) fail(`${label} command ${field} is empty`);
    if (!templateText.includes("{")) {
      if (templateText !== actualText) fail(`${label} command ${field} does not match frozen template`);
      return;
    }
    if (templateText === "{harness}" || templateText === "{fixture}") {
      if (basename(actualText) !== values[templateText.slice(1, -1)]) fail(`${label} command ${field} does not name the retained ${templateText.slice(1, -1)} executable`);
      return;
    }
    if (templateText.includes("{input_root}")) {
      // The extracted input root is producer-private; only its declared suffix is fixed by the template.
      const suffix = templateText.slice(templateText.indexOf("{input_root}") + "{input_root}".length);
      const expectedTail = suffix.split(/[\\/]+/).filter(Boolean);
      const actualSegments = actualText.split(/[\\/]+/).filter(Boolean);
      const actualTail = actualSegments.slice(actualSegments.length - expectedTail.length);
      if (!templateText.startsWith("{input_root}") || actualSegments.length <= expectedTail.length
          || actualTail.some((segment, index) => segment !== expectedTail[index])) fail(`${label} command ${field} does not match frozen template`);
      return;
    }
    const resolved = substituteTemplate(templateText, values);
    if (!samePathSegments(resolved, actualText)) fail(`${label} command ${field} does not match frozen template`);
  };
  template.argv.forEach((argument, index) => compare(argument, actual.argv[index], `argv[${index}]`));
  compare(template.tool_file, actual.tool_file, "tool_file");
  const templateEnv = template.env ?? {};
  if (actual.env === null || typeof actual.env !== "object" || Array.isArray(actual.env)) fail(`${label} command env must be an object`);
  equalValue(Object.keys(actual.env).sort(), Object.keys(templateEnv).sort(), `${label} command env keys`);
  for (const [key, value] of Object.entries(templateEnv)) compare(value, actual.env[key], `env ${key}`);
}

/** Schema validation is shared by the immutable packet reader and reader-only fixtures.
 * Expected manifest identity is supplied independently; feature bytes never choose it.
 * `manifestBytes` are the reviewed manifest bytes (the scripts copy); the packet copy must be byte-equal.
 */
export function ValidateV06FeatureEvidence(feature, manifestBytes, expected) {
  if (!Buffer.isBuffer(manifestBytes)) fail("case manifest bytes are required");
  if (!SHA256.test(expected.case_manifest_sha256) || ManifestDigest(manifestBytes) !== expected.case_manifest_sha256
      || feature?.case_manifest_sha256 !== expected.case_manifest_sha256) fail("case manifest differs from independently frozen manifest digest");
  const manifest = ParseCanonicalManifest(manifestBytes);
  allowedKeys(manifest, MANIFEST_KEYS, [], "case manifest");
  if (manifest.schema_version !== 2 || manifest.state !== "frozen") fail("case manifest requires frozen real assertion bindings");
  allowedKeys(feature, FEATURE_KEYS, [], "feature evidence");
  if (feature.schema_version !== 2 || feature.version !== expected.version || feature.target !== expected.target
      || !Array.isArray(manifest.targets) || !manifest.targets.includes(expected.target)) fail("feature version/target does not match candidate");
  allowedKeys(expected.source, ["superrepo_commit", "compiler_commit"], [], "expected source");
  equalValue(feature.source, expected.source, "feature source");
  if (!Array.isArray(manifest.cases) || !manifest.cases.length || !Array.isArray(feature.cases)) fail("manifest cases are missing");
  if (!Array.isArray(manifest.provisional_cases)) fail("manifest provisional case list is missing");
  const provisional = new Set();
  for (const item of manifest.provisional_cases) {
    allowedKeys(item, ["id", "requirement_ids", "moved_from", "spec_change", "former_obligation", "reason"], [], "provisional case");
    if (provisional.has(item.id)) fail(`manifest duplicate provisional case ${item.id}`);
    provisional.add(item.id);
  }
  if (!manifest.policy || manifest.policy.all_cases_mandatory !== true || manifest.policy.provisional_cases_reject !== true
      || manifest.policy.installed_prefix_only !== true) fail("manifest policy weakens mandatory evaluation");
  for (const kind of Object.keys(manifest.required_obligations)) if (!OBLIGATION_KINDS.includes(kind)) fail(`undeclared obligation kind ${kind}`);
  if (Object.hasOwn(manifest.rust_profile, "transport")) fail("stdio transport is provisional and cannot be a 0.6 profile dimension");
  const required = new Map();
  for (const item of manifest.cases) {
    allowedKeys(item, CASE_KEYS, [], `manifest case ${item?.id}`);
    if (required.has(item.id)) fail(`manifest duplicate case ${item.id}`);
    if (provisional.has(item.id)) fail(`provisional case ${item.id} cannot be evaluated`);
    if (!EXECUTION_KINDS.includes(item.execution)) fail(`manifest case ${item.id} has an unknown execution kind`);
    const binding = item.binding;
    if (!binding || typeof binding !== "object") fail(`manifest binding missing for ${item.id}`);
    allowedKeys(binding, BINDING_KEYS[item.execution], BINDING_OPTIONAL, `${item.id} binding`);
    if (!Array.isArray(binding.required_test_ids) || !binding.required_test_ids.length
        || new Set(binding.required_test_ids).size !== binding.required_test_ids.length) fail(`manifest binding missing for ${item.id}`);
    if (binding.harness_language !== HARNESS_LANGUAGES[item.execution]) fail(`${item.id} assertion declaration language missing or unsupported`);
    if (binding.reviewed_source_binding !== true || !Array.isArray(binding.assertion_provenance)
        || binding.assertion_provenance.length !== binding.required_test_ids.length) fail(`${item.id} reviewed assertion provenance missing`);
    if (binding.log !== caseLogName(item.id)) fail(`${item.id} log identity mismatch`);
    if (item.execution === "installed_host_harness" && !manifest.harness_executables?.[binding.harness]) fail(`${item.id} names an undeclared harness`);
    if (binding.fixture !== null && !manifest.fixture_executables?.[binding.fixture]) fail(`${item.id} names an undeclared fixture`);
    required.set(item.id, item);
  }
  if (!feature.runtime_kit || feature.runtime_kit.sha256 !== expected.runtime_kit_sha256 || feature.runtime_kit.abi_sha256 !== expected.runtime_abi_sha256 || !SHA256.test(expected.runtime_abi_sha256)) fail("runtime kit identity mismatch");
  allowedKeys(feature.runtime_kit, ["sha256", "abi_sha256", "receipt", "abi_receipt"], [], "runtime kit");
  allowedKeys(feature.installed_prefix, ["path", "receipt", "manifest_sha256", "fallback_used"], [], "installed prefix");
  if (feature.installed_prefix.fallback_used !== false) fail("installed prefix fallback cannot qualify");
  if (!feature.not_applicable || Object.keys(feature.not_applicable).some(key => key !== "dotnet_glue")
      || feature.not_applicable.dotnet_glue !== "stretch") fail("mandatory Rust Glue cannot use an exemption");
  requireDirectory(expected.packet_root, "retained packet");
  if (!expected.packet_files || typeof expected.packet_files !== "object") fail("retained packet closure missing");
  const declaredFiles = Object.keys(expected.packet_files).sort();
  for (const name of declaredFiles) checkedPacketFile(expected, { path: name, sha256: expected.packet_files[name] }, "retained packet");
  equalValue(readdirSync(expected.packet_root).filter(name => name !== "SHA256SUMS").sort(), declaredFiles, "retained packet file closure");
  const targetFiles = manifest.target_packet_files?.[expected.target];
  if (!Array.isArray(manifest.packet_files) || !Array.isArray(targetFiles)) fail("frozen manifest packet closure missing");
  for (const name of [...manifest.packet_files, ...targetFiles]) if (!(packetName(name) in expected.packet_files)) fail(`frozen packet file ${name} is not retained`);
  for (const name of Object.keys(manifest.harness_executables ?? {})) if (!targetFiles.includes(harnessPacketName(name, expected.target))) fail(`harness ${name} is not retained for ${expected.target}`);
  for (const name of Object.keys(manifest.fixture_executables ?? {})) if (!targetFiles.includes(fixturePacketName(name, expected.target))) fail(`fixture ${name} is not retained for ${expected.target}`);
  const packetManifest = checkedPacketFile(expected, { path: MANIFEST_FILE, sha256: expected.packet_files[MANIFEST_FILE] }, "retained case manifest");
  if (!packetManifest.equals(manifestBytes)) fail("retained case manifest does not match frozen expected identity");
  const installed = JSON.parse(checkedPacketFile(expected, { path: feature.installed_prefix.receipt,
    sha256: feature.installed_prefix.manifest_sha256 }, "installed prefix receipt"));
  allowedKeys(installed, RECEIPT_KEYS, [], "installed prefix receipt");
  if (feature.installed_prefix.receipt !== INSTALLED_RECEIPT) fail("installed prefix receipt name mismatch");
  if (installed.prefix !== feature.installed_prefix.path || installed.target !== expected.target) fail("installed prefix receipt target/path mismatch");
  equalValue(installed.source, expected.source, "installed prefix source");
  if (installed.version !== expected.version || installed.runtime_kit_sha256 !== expected.runtime_kit_sha256
      || installed.abi_sha256 !== expected.runtime_abi_sha256 || installed.bundle_sha256 !== expected.candidate_bundle_sha256)
    fail("installed receipt version/runtime ABI/bundle identity mismatch");
  allowedKeys(installed.cli, ["relative_path", "packet_copy", "sha256"], [], "installed receipt cli");
  const cliSegments = confinedRelativePath(installed.cli.relative_path, "installed receipt cli relative path");
  if (cliSegments.length !== 2 || cliSegments[0] !== "bin" || !/^beskid(\.exe)?$/.test(cliSegments[1])) fail("installed receipt cli must be <prefix>/bin/beskid");
  if (installed.cli.sha256 !== expected.candidate_cli_sha256
      || !samePathSegments(`${installed.prefix}/${installed.cli.relative_path}`, expected.installed_cli)) fail("installed receipt cli ownership mismatch");
  checkedPacketFile(expected, { path: installed.cli.packet_copy, sha256: installed.cli.sha256 }, "installed receipt cli");
  if (feature.runtime_kit.receipt !== RUNTIME_KIT_RECEIPT || feature.runtime_kit.abi_receipt !== RUNTIME_ABI_RECEIPT) fail("runtime kit receipt names mismatch");
  checkedPacketFile(expected, { path: feature.runtime_kit.receipt, sha256: expected.runtime_kit_sha256 }, "runtime kit receipt");
  checkedPacketFile(expected, { path: feature.runtime_kit.abi_receipt, sha256: expected.runtime_abi_sha256 }, "runtime ABI receipt");
  if (!SHA256.test(installed.corelib_fingerprint)) fail("installed receipt Corelib fingerprint must be SHA-256");
  const fingerprintBytes = checkedPacketFile(expected, { path: CORELIB_FINGERPRINT_FILE, sha256: expected.packet_files[CORELIB_FINGERPRINT_FILE] }, "installed Corelib fingerprint");
  if (fingerprintBytes.toString("utf8").trim() !== installed.corelib_fingerprint) fail("installed Corelib fingerprint file disagrees with the receipt");
  if (!Array.isArray(installed.files) || !installed.files.length) fail("installed prefix artifact closure missing");
  for (const reference of installed.files) checkedPacketFile(expected, reference, "installed prefix artifact");
  const harnessDigests = new Map();
  for (const name of Object.keys(manifest.harness_executables ?? {})) {
    const file = harnessPacketName(name, expected.target);
    harnessDigests.set(name, { file, sha256: expected.packet_files[file] });
  }
  const actual = new Map();
  for (const row of feature.cases) {
    allowedKeys(row, ROW_KEYS, [], `case row ${row?.id}`);
    if (actual.has(row.id)) fail(`duplicate case ${row.id}`);
    if (provisional.has(row.id)) fail(`provisional case ${row.id} cannot be evaluated`);
    const item = required.get(row.id);
    if (!item) fail(`undeclared case ${row.id}`);
    const binding = item.binding;
    equalValue(row.requirement_ids, item.requirement_ids, `${row.id} requirement identity`);
    if (row.status !== "success" || row.exit_code !== 0 || row.timed_out !== false) fail(`${row.id} did not execute successfully`);
    equalValue(row.source, expected.source, `${row.id} source`);
    if (row.target !== expected.target) fail(`${row.id} target mismatch`);
    if (row.runtime_kit_sha256 !== expected.runtime_kit_sha256 || row.candidate_cli_sha256 !== expected.candidate_cli_sha256
        || row.candidate_bundle_sha256 !== expected.candidate_bundle_sha256) fail(`${row.id} runtime/artifact mismatch`);
    equalValue(row.harness_source, binding.harness_source, `${row.id} harness source`);
    if (binding.harness_source.path !== sourcePacketName(binding.source_file)) fail(`${row.id} harness source packet name mismatch`);
    const harness = checkedPacketFile(expected, row.harness_source, `${row.id} harness source`);
    const proven = new Set();
    for (const proof of binding.assertion_provenance) {
      if (proven.has(proof?.test_id)) fail(`${row.id} assertion provenance identity mismatch`);
      equalValue(proof.source, binding.harness_source, `${row.id} assertion source binding`);
      checkProvenance(binding.harness_language, harness, proof, binding.required_test_ids, row.id);
      proven.add(proof.test_id);
    }
    const values = { installed_cli: expected.installed_cli, installed_prefix: installed.prefix,
      installed_corelib: `${installed.prefix}/beskid_corelib`, harness: binding.harness ? harnessPacketName(binding.harness, expected.target) : "",
      fixture: binding.fixture ? fixturePacketName(binding.fixture, expected.target) : "" };
    commandMatches(binding.command, row.command, values, row.id);
    if (!samePathSegments(row.command.installed_cli, expected.installed_cli)) fail(`${row.id} command must execute installed candidate cli`);
    let toolFile;
    if (item.execution === "installed_native") {
      if (!samePathSegments(row.command.argv[0], expected.installed_cli) || row.command.tool_sha256 !== expected.candidate_cli_sha256
          || !samePathSegments(row.command.tool_file, expected.installed_cli)) fail(`${row.id} command must execute installed candidate cli`);
      toolFile = installed.cli.packet_copy;
    } else {
      const harnessFile = harnessDigests.get(binding.harness);
      if (!harnessFile || basename(row.command.argv[0]) !== harnessFile.file || row.command.tool_sha256 !== harnessFile.sha256
          || basename(row.command.tool_file) !== harnessFile.file) fail(`${row.id} command must execute the retained harness executable`);
      if (!samePathSegments(row.command.env.BESKID_V06_QUALIFIED_PREFIX ?? "", installed.prefix)) fail(`${row.id} harness must receive the installed prefix`);
      toolFile = harnessFile.file;
    }
    checkedPacketFile(expected, { path: toolFile, sha256: row.command.tool_sha256 }, `${row.id} command tool`);
    if (row.command.version !== `${toolFile}@${row.command.tool_sha256}`) fail(`${row.id} command tool version/argv missing`);
    if (binding.input === null) {
      if (row.input_sha256 !== null) fail(`${row.id} input_sha256 digest mismatch`);
    } else {
      if (row.input_sha256 !== binding.input.sha256 || binding.input.path !== inputPacketName(binding.input.id)) fail(`${row.id} input_sha256 digest mismatch`);
      checkedPacketFile(expected, binding.input, `${row.id} input`);
    }
    const artifactName = binding.fixture ? fixturePacketName(binding.fixture, expected.target) : CORELIB_FINGERPRINT_FILE;
    if (row.artifact !== artifactName) fail(`${row.id} artifact identity mismatch`);
    checkedPacketFile(expected, { path: row.artifact, sha256: row.artifact_sha256 }, `${row.id} artifact_sha256`);
    if (row.stdout !== caseStdoutName(row.id) || row.stderr !== caseStderrName(row.id)) fail(`${row.id} retained output names mismatch`);
    const stdout = checkedPacketFile(expected, { path: row.stdout, sha256: row.stdout_sha256 }, `${row.id} stdout_sha256`);
    const stderr = checkedPacketFile(expected, { path: row.stderr, sha256: row.stderr_sha256 }, `${row.id} stderr_sha256`);
    if (stdout.length > OUTPUT_LIMIT || stderr.length > OUTPUT_LIMIT) fail(`${row.id} bounded output exceeded`);
    let executed;
    if (item.execution === "installed_native") {
      executed = nativeReportOutcomes(stdout, binding.target, row.id).sort();
    } else {
      const outSections = parseSections(stdout.toString("utf8"), `${row.id} stdout`);
      const errSections = parseSections(stderr.toString("utf8"), `${row.id} stderr`);
      equalValue([...outSections.keys()].sort(), [...binding.required_test_ids].sort(), `${row.id} executed assertion sections`);
      equalValue([...errSections.keys()].sort(), [...binding.required_test_ids].sort(), `${row.id} executed assertion stderr sections`);
      for (const id of binding.required_test_ids) {
        const out = outSections.get(id), err = errSections.get(id);
        if (out.exit_code !== 0 || out.timed_out || err.exit_code !== 0 || err.timed_out) fail(`${row.id} assertion ${id} did not exit successfully`);
        const qualified = libtestPath(binding.source_file, manifest.harness_executables[binding.harness].source_root, id);
        if (libtestOutcome(out.lines, qualified) !== "passed") fail(`${row.id} assertion ${id} was failed, skipped or nonexecuted`);
        const invocations = err.lines.map(line => INVOCATION_LINE.exec(line)).filter(Boolean);
        if (!invocations.length) fail(`${row.id} assertion ${id} has no installed invocation proof`);
        for (const [, digest, argv0] of invocations) {
          if (digest !== installed.cli.sha256 || argv0 !== cliSegments[1]) fail(`${row.id} assertion ${id} invoked a compiler other than the installed candidate`);
        }
      }
      executed = [...binding.required_test_ids].sort();
    }
    for (const id of binding.required_test_ids) if (!executed.includes(id)) fail(`${row.id} required assertion ${id} was not executed`);
    if (!Array.isArray(row.tests) || row.tests.some(test => !test || test.outcome !== "passed" || typeof test.id !== "string")) fail(`${row.id} assertions were failed, skipped or nonexecuted`);
    equalValue(row.tests.map(test => test.id).sort(), executed, `${row.id} derived executed assertions`);
    if (row.log !== binding.log) fail(`${row.id} log identity mismatch`);
    const retained = JSON.parse(checkedPacketFile(expected, { path: row.log, sha256: row.log_sha256 }, `${row.id} log`));
    const claimed = { ...row }; delete claimed.log_sha256;
    equalValue(retained, claimed, `${row.id} retained log digest/contents`);
    actual.set(row.id, row);
  }
  for (const id of required.keys()) if (!actual.has(id)) fail(`missing mandatory case ${id}`);
  function assertLinked(row, category) {
    if (provisional.has(row.case_id)) fail(`provisional case ${row.case_id} cannot be evaluated`);
    const item = required.get(row.case_id);
    if (!item || !actual.get(row.case_id)?.tests.some(test => test.id === row.test_id)) fail(`${category} assertion is not executed`);
    return item.binding;
  }
  const profile = new Map();
  for (const row of feature.rust_profile_matrix ?? []) {
    const key = JSON.stringify([row.representation, row.implementation, row.direction]);
    if (profile.has(key)) fail("duplicate Rust profile matrix dimension");
    const binding = assertLinked(row, "Rust profile");
    if (!binding.profile_assertions?.some(proof => proof.test_id === row.test_id && proof.representation === row.representation
        && proof.implementation === row.implementation && proof.direction === row.direction)) fail("Rust profile assertion binding mismatch");
    profile.set(key, row);
  }
  let dimensions = 0;
  for (const representation of manifest.rust_profile.representations) for (const implementation of manifest.rust_profile.implementations)
    for (const direction of manifest.rust_profile.directions) {
      dimensions++;
      if (!profile.has(JSON.stringify([representation, implementation, direction]))) fail(`missing Rust profile matrix ${representation}/${implementation}/${direction}`);
    }
  if (profile.size !== dimensions) fail("undeclared Rust profile representation");
  const obligations = new Map();
  for (const row of feature.obligation_matrix ?? []) {
    const key = JSON.stringify([row.kind, row.obligation]);
    if (obligations.has(key)) fail("duplicate obligation matrix identity");
    const binding = assertLinked(row, "obligation");
    if (!binding.obligation_assertions?.some(proof => proof.kind === row.kind && proof.obligation === row.obligation && proof.test_id === row.test_id)) fail("obligation assertion binding mismatch");
    obligations.set(key, row);
  }
  let count = 0;
  for (const [kind, items] of Object.entries(manifest.required_obligations)) for (const obligation of items) {
    count++;
    if (!obligations.has(JSON.stringify([kind, obligation]))) fail(`missing mandatory ${kind} obligation ${obligation}`);
  }
  if (obligations.size !== count) fail("undeclared obligation matrix identity");
  return { schema_version: 2, target: feature.target, cases: feature.cases, runtime_kit: feature.runtime_kit,
    case_manifest_sha256: feature.case_manifest_sha256, not_applicable: feature.not_applicable,
    provisional_cases: manifest.provisional_cases.map(item => item.id) };
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
  const [major, minor] = expectedVersion.split(".").map(Number);
  if ((major > 0 || minor >= 6) && glue?.status === "not_applicable") {
    fail(`${definition.platform} Glue is required for ${expectedVersion}; the historical v0.5 exemption cannot qualify this release`);
  }
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
  // Schema dispatch is decided by the release series, never by file presence: a 0.6 candidate
  // requires schema-2 evidence and rejects schema-1 files as undeclared artifacts.
  const version2 = !/^0\.[0-5]\./.test(expectedVersion);
  if (!version2 && existsSync(join(directory, FEATURE_FILE))) fail("version 2 feature evidence requires release series 0.6");
  if (version2 && existsSync(join(directory, "feature-evidence-v1.json"))) {
    fail(`${definition.platform} Glue is required for ${expectedVersion}; the historical v0.5 exemption cannot qualify this release (schema-2 evidence is required and feature-evidence-v1.json is an undeclared artifact)`);
  }
  let expectedArtifacts = [definition.cli, definition.lsp, bundle, resultName, "woodpecker-build-result.json", "feature-evidence-v1.json", ...FEATURE_CASES.map(({ id }) => featureLogName(id))];
  if (definition.platform === "linux") expectedArtifacts.push("cli-surface-evidence-v1.json", "cli-surface-receipt-v1.json");
  const buildResult = readJson(join(directory, "woodpecker-build-result.json"), `${definition.platform} build result`);
  if (version2) {
    const keys = ["schema_version", "platform", "target", "version", "channel", "output_path", "source", "runtime_kit_sha256", "runtime_abi_sha256", "installed_cli", "platform_result_status", "published"];
    if (definition.platform === "linux") keys.push("corelib_fingerprint");
    exactKeys(buildResult, keys, `${definition.platform} build result`);
    if (!SHA256.test(buildResult.runtime_abi_sha256)) fail(`${definition.platform} build result runtime_abi_sha256 must be a lowercase SHA-256 hash`);
    requireString(buildResult.installed_cli, `${definition.platform} build result installed_cli`);
  }
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

  let manifestBytes;
  if (version2) {
    requireRegularFile(join(scripts, MANIFEST_FILE), "reviewed v0.6 case manifest");
    manifestBytes = readFileSync(join(scripts, MANIFEST_FILE));
    if (ManifestDigest(manifestBytes) !== V06_CASE_MANIFEST_SHA256) fail("v0.6 case manifest requires independently frozen real assertion bindings");
    const manifest = ParseCanonicalManifest(manifestBytes);
    if (manifest.state !== "frozen") fail("v0.6 case manifest requires independently frozen real assertion bindings");
    // The reviewed binding manifest, never feature claims, defines packet closure.
    const targetFiles = manifest.target_packet_files?.[definition.target];
    if (!Array.isArray(manifest.packet_files) || !manifest.packet_files.length || !Array.isArray(targetFiles)) fail("frozen manifest packet closure missing");
    expectedArtifacts = [...new Set([definition.cli, definition.lsp, bundle, resultName, "woodpecker-build-result.json",
      FEATURE_FILE, MANIFEST_FILE, ...manifest.packet_files, ...targetFiles])];
    if (definition.platform === "linux") expectedArtifacts.push("cli-surface-evidence-v1.json", "cli-surface-receipt-v1.json");
  }
  const checksums = readChecksums(join(directory, "SHA256SUMS"), definition.platform, expectedArtifacts);
  const features = version2 ? ValidateV06FeatureEvidence(
    readJson(join(directory, FEATURE_FILE), "v0.6 feature evidence"), manifestBytes, {
      version: expectedVersion, target: definition.target, source: buildResult.source,
      case_manifest_sha256: V06_CASE_MANIFEST_SHA256, packet_root: directory,
      packet_files: Object.fromEntries(checksums), runtime_kit_sha256: buildResult.runtime_kit_sha256,
      runtime_abi_sha256: buildResult.runtime_abi_sha256, candidate_cli_sha256: checksums.get(definition.cli),
      candidate_bundle_sha256: checksums.get(bundle), installed_cli: buildResult.installed_cli,
    }) : validateFeatures(directory, definition, expectedSource, expectedVersion, buildResult, checksums);
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
    // The publishable release assets of this platform; every other retained artifact is evidence.
    release_assets: [definition.cli, definition.lsp, bundle],
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

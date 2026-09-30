#!/usr/bin/env node
// Produce source-bound, target-native v0.5 conformance evidence.
// Usage: woodpecker-feature-evidence.mjs <platform> <version> <output-dir> <bundle-dir>
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const PLATFORMS = {
  linux: { target: "x86_64-unknown-linux-gnu", executable: "beskid" },
  macos: { target: "aarch64-apple-darwin", executable: "beskid" },
  windows: { target: "x86_64-pc-windows-msvc", executable: "beskid.exe" },
};
const CASES = [
  ["foundations.core_bytes", "CoreBytesTests"], ["foundations.encoding_utf8", "CoreEncodingUtf8Tests"],
  ["foundations.time", "SystemTimeTests"], ["foundations.fibers", "ConcurrencyFiberHandleTests"],
  ["foundations.channels", "ConcurrencyChannelApiTests"], ["network.types", "NetworkTypesTests"],
  ["network.dns", "NetworkDnsTests"], ["network.tcp", "NetworkTcpTests"], ["network.udp", "NetworkUdpTests"],
  ["network.scope", "NetworkScopeTests"], ["network.shutdown", "NetworkShutdownLeakTests"],
  ["network.disposable", "NetworkDisposableTests"], ["http.codec", "HttpCodecTests"],
  ["http.validation", "HttpValidationTests"], ["http.serialization", "HttpSerializationTests"],
  ["http.exchange", "HttpExchangeTests"],
];
const GLUE_REASON = "Glue bindings are outside the v0.5 release contract; generated Rust/.NET bindings remain deferred to v0.6.";

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function digestTree(root) {
  const rootStat = lstatSync(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) fail("release runtime kit must be a real directory");
  const files = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const full = join(path, entry.name);
      if (entry.isSymbolicLink()) fail(`runtime kit contains symlink: ${relative(root, full)}`);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(full);
      else fail(`runtime kit contains unsupported entry: ${relative(root, full)}`);
    }
  }
  visit(root);
  if (files.length === 0) fail("runtime kit is empty");
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(relative(root, file).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}
function writeJson(path, value) { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" }); }

try {
  if (process.argv.length !== 6) fail("usage: woodpecker-feature-evidence.mjs <linux|macos|windows> <version> <output-dir> <bundle-dir>");
  const [, , platform, version, outputArg, bundleArg] = process.argv;
  const definition = PLATFORMS[platform];
  if (!definition) fail("unsupported platform");
  const output = resolve(outputArg);
  const bundle = resolve(bundleArg);
  const buildResult = JSON.parse(readFileSync(join(output, "woodpecker-build-result.json"), "utf8"));
  if (buildResult.platform !== platform || buildResult.target !== definition.target || buildResult.version !== version) fail("build result identity does not match feature run");
  const project = join(bundle, "beskid_corelib", "CoreLib.bws");
  const executable = join(bundle, "bin", definition.executable);
  const kit = join(bundle, "lib", "beskid-runtime", "abi-5", definition.target, "release");
  const runtimeAbi = join(kit, "abi.json");
  for (const path of [project, executable, runtimeAbi]) {
    try { if (!lstatSync(path).isFile()) fail(`required feature input is not a regular file: ${path}`); }
    catch { fail(`required feature input is missing: ${path}`); }
  }
  const runtimeDigest = digestTree(kit);
  if (runtimeDigest !== buildResult.runtime_kit_sha256) fail("bundle runtime-kit digest does not match build result");
  const abiBytes = readFileSync(runtimeAbi);
  const cases = [];
  for (const [id, target] of CASES) {
    const logName = `feature-${id.replaceAll(".", "-")}.json`;
    const run = spawnSync(executable, ["test", "--plain", "--json", "--project", project, "--target", target, "--target-timeout", "900"], {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    let record;
    try { record = JSON.parse(run.stdout); }
    catch { writeFileSync(join(output, logName), `${JSON.stringify({ target, exit_code: run.status, stdout: run.stdout ?? "", stderr: run.stderr ?? "" }, null, 2)}\n`, { flag: "wx" }); fail(`${target} did not return JSON test evidence (exit ${run.status})`); }
    writeJson(join(output, logName), record);
    if (run.error || run.status !== 0) fail(`${target} failed or returned an unexpected test report`);
    validateTestReport(record, target);
    const passed = record.tests.filter(test => test.outcome === "passed").map(test => test.qualified_name);
    cases.push({ id, target, status: "success", log: logName, log_sha256: sha256(readFileSync(join(output, logName))), test_ids: passed });
  }
  writeJson(join(output, "feature-evidence-v1.json"), {
    schema_version: 1, platform, target: definition.target, version,
    source: buildResult.source,
    runtime_kit: { profile: "release", target: definition.target, sha256: runtimeDigest, abi_sha256: sha256(abiBytes) },
    cases,
    not_applicable: { glue: { status: "not_applicable", reason: GLUE_REASON } },
  });
} catch (error) {
  process.stderr.write(`woodpecker feature evidence: ${error.message}\n`);
  process.exit(1);
}

function validateTestReport(record, target) {
  if (record.target !== target || !Array.isArray(record.tests)) fail(`${target} failed or returned an unexpected test report`);
  const summary = record.summary;
  if (summary === null || Array.isArray(summary) || typeof summary !== "object") fail(`${target} summary is missing or invalid`);
  const outcomes = { passed: 0, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 };
  for (const item of record.tests) {
    if (item === null || Array.isArray(item) || typeof item !== "object" || !Object.hasOwn(outcomes, item.outcome) || typeof item.qualified_name !== "string" || item.qualified_name.length === 0) {
      fail(`${target} contains an invalid test record`);
    }
    outcomes[item.outcome] += 1;
  }
  for (const [name, count] of Object.entries(outcomes)) {
    if (!Number.isSafeInteger(summary[name]) || summary[name] < 0) fail(`${target} summary.${name} must be a non-negative integer`);
    if (summary[name] !== count) fail(`${target} summary counts do not match tests`);
  }
  if (record.tests.length === 0 || outcomes.passed === 0 || outcomes.failed + outcomes.skipped + outcomes.filtered_out + outcomes.timed_out > 0) {
    fail(`${target} contains skipped, filtered, timed-out, or failed tests`);
  }
}

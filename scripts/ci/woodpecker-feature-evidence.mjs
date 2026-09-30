#!/usr/bin/env node
// Produce source-bound, target-native v0.5 conformance evidence.
// Usage: woodpecker-feature-evidence.mjs <platform> <version> <output-dir> <bundle-dir> <runtime-kit-dir>
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
  if (process.argv.length !== 7) fail("usage: woodpecker-feature-evidence.mjs <linux|macos|windows> <version> <output-dir> <bundle-dir> <runtime-kit-dir>");
  const [, , platform, version, outputArg, bundleArg, kitArg] = process.argv;
  const definition = PLATFORMS[platform];
  if (!definition) fail("unsupported platform");
  const output = resolve(outputArg);
  const bundle = resolve(bundleArg);
  const kit = resolve(kitArg);
  const buildResult = JSON.parse(readFileSync(join(output, "woodpecker-build-result.json"), "utf8"));
  if (buildResult.platform !== platform || buildResult.target !== definition.target || buildResult.version !== version) fail("build result identity does not match feature run");
  const project = join(bundle, "beskid_corelib", "CoreLib.bws");
  const executable = join(output, definition.executable);
  const runtimeAbi = join(kit, "lib", "beskid-runtime", "abi-5", definition.target, "release", "abi.json");
  for (const path of [project, executable, runtimeAbi]) {
    try { if (!lstatSync(path).isFile()) fail(`required feature input is not a regular file: ${path}`); }
    catch { fail(`required feature input is missing: ${path}`); }
  }
  const runtimeDigest = digestTree(kit);
  if (runtimeDigest !== buildResult.runtime_kit_sha256) fail("runtime kit changed after build result was recorded");
  const abiBytes = readFileSync(runtimeAbi);
  const cases = [];
  for (const [id, target] of CASES) {
    const logName = `feature-${id.replaceAll(".", "-")}.json`;
    const run = spawnSync(executable, ["test", "--plain", "--json", "--project", project, "--target", target], { encoding: "utf8", windowsHide: true });
    const content = `${run.stdout ?? ""}${run.stderr ? `\n${run.stderr}` : ""}`;
    let record;
    try { record = JSON.parse(run.stdout); }
    catch { writeFileSync(join(output, logName), `${JSON.stringify({ target, exit_code: run.status, stdout: run.stdout ?? "", stderr: run.stderr ?? "" }, null, 2)}\n`, { flag: "wx" }); fail(`${target} did not return JSON test evidence (exit ${run.status})`); }
    writeJson(join(output, logName), record);
    if (run.error || run.status !== 0 || record.target !== target || !Array.isArray(record.tests)) fail(`${target} failed or returned an unexpected test report`);
    const passed = record.tests.filter(test => test?.outcome === "passed").map(test => test.qualified_name);
    if (record.tests.some(test => test?.outcome !== "passed" && test?.outcome !== "skipped") || passed.length === 0) fail(`${target} has failed, unexecuted, or empty tests`);
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

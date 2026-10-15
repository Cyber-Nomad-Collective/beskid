#!/usr/bin/env node
// Produce schema-2 (0.6) release case evidence for one native target from an extracted candidate bundle.
//
// Usage: woodpecker-release-cases-v06.mjs <platform> <version> <output-dir> <bundle-dir> --harness-dir <dir>
//                                          [--manifest <path>] [--repo <root>] [--cell-timeout <seconds>]
//
// Every case of the frozen manifest runs through its execution kind:
//   installed_native       the installed CLI runs one `beskid test --json` target; the raw JSON report is the
//                          retained stdout and the producer never rewrites it.
//   installed_host_harness the retained harness executable runs one `--exact` process per required id with
//                          BESKID_V06_QUALIFIED_PREFIX naming the bundle; raw libtest stdout/stderr are retained
//                          in per-test sections, and a test without an installed invocation proof line in its
//                          stderr is recorded as not_executed.
// The producer refuses to run when the bundle lacks its own runtime kit or Corelib (no fallback discovery),
// pins every retained source and input against the manifest digests, and fails closed with the list of
// cases that did not pass. `--manifest` is a test-only override; pipelines forbid it.
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  CORELIB_FINGERPRINT_FILE, FEATURE_FILE, InputArchive, InputSpec, INSTALLED_RECEIPT, INVOCATION_LINE, MANIFEST_FILE, ManifestDigest,
  OUTPUT_LIMIT, ParseCanonicalManifest, RUNTIME_ABI_RECEIPT, RUNTIME_KIT_RECEIPT, caseLogName, caseStderrName, caseStdoutName,
  fail, fixturePacketName, harnessPacketName, libtestOutcome, libtestPath, nativeReportOutcomes, parseSections, samePathSegments, sha256,
  substituteCommand,
} from "./release-case-common.mjs";
import { RuntimeKitReceiptBytes } from "./woodpecker-runtime-kit-digest.mjs";

const scripts = dirname(fileURLToPath(import.meta.url));
const PLATFORMS = {
  linux: { target: "x86_64-unknown-linux-gnu", executable: "beskid", cli: "beskid-linux-amd64" },
  macos: { target: "aarch64-apple-darwin", executable: "beskid", cli: "beskid-darwin-arm64" },
  windows: { target: "x86_64-pc-windows-msvc", executable: "beskid.exe", cli: "beskid-windows-amd64.exe" },
};
const PASSTHROUGH_ENV = ["PATH", "SYSTEMROOT", "SystemRoot", "TEMP", "TMP", "TMPDIR", "COMSPEC", "PATHEXT", "WINDIR", "LANG", "LC_ALL",
  "BESKID_V06_GLUE_CARGO", "BESKID_V06_GLUE_RUSTC", "BESKID_V06_GLUE_LINKER", "CARGO_HOME", "RUSTUP_HOME", "BESKID_V06_QUALIFIED_PROFILE",
  "BESKID_CODEGEN_THREADS", "RUST_MIN_STACK", "SSL_CERT_FILE", "LD_LIBRARY_PATH", "DYLD_LIBRARY_PATH"];

function parseArguments(argv) {
  const positional = [];
  const options = { harness: null, manifest: join(scripts, MANIFEST_FILE), manifestOverride: false, repo: resolve(scripts, "../.."), cellTimeout: 900 };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === "--harness-dir") options.harness = resolve(argv[++index] ?? fail("--harness-dir needs a value"));
    else if (argument === "--manifest") { options.manifest = resolve(argv[++index] ?? fail("--manifest needs a value")); options.manifestOverride = true; }
    else if (argument === "--repo") options.repo = resolve(argv[++index] ?? fail("--repo needs a value"));
    else if (argument === "--cell-timeout") options.cellTimeout = Number(argv[++index]);
    else positional.push(argument);
  }
  if (positional.length !== 4 || !options.harness || !Number.isSafeInteger(options.cellTimeout) || options.cellTimeout <= 0) {
    fail("usage: woodpecker-release-cases-v06.mjs <linux|macos|windows> <version> <output-dir> <bundle-dir> --harness-dir <dir> [--manifest <path>] [--repo <root>] [--cell-timeout <seconds>]");
  }
  if (options.manifestOverride && (process.env.CI_PIPELINE_NUMBER || process.env.CI_COMMIT_SHA)) fail("--manifest is test-only and forbidden in a pipeline");
  const [platform, version, output, bundle] = positional;
  return { ...options, platform, version, output: resolve(output), bundle: resolve(bundle) };
}

function requireFile(path, label) {
  let stats;
  try { stats = lstatSync(path); } catch { fail(`${label} is missing: ${path}`); }
  if (stats.isSymbolicLink() || !stats.isFile()) fail(`${label} must be a regular file: ${path}`);
  return path;
}
function retain(output, name, bytes, { executable = false } = {}) {
  const path = join(output, name);
  writeFileSync(path, bytes, { flag: "wx" });
  if (executable) chmodSync(path, 0o755);
  return { path: name, sha256: sha256(bytes) };
}
function privateHome(root, label) {
  const home = join(root, label);
  for (const directory of ["user-home", "toolchain-home", "config"]) mkdirSync(join(home, directory), { recursive: true });
  return home;
}
function childEnvironment(home, extra) {
  const env = {};
  for (const name of PASSTHROUGH_ENV) if (process.env[name] !== undefined) env[name] = process.env[name];
  env.HOME = join(home, "user-home");
  env.USERPROFILE = join(home, "user-home");
  env.BESKID_HOME = join(home, "toolchain-home");
  env.BESKID_CONFIG_DIR = join(home, "config");
  env.OTEL_SDK_DISABLED = "true";
  return { ...env, ...extra };
}
function run(argv, env, cwd, timeoutSeconds) {
  const result = spawnSync(argv[0], argv.slice(1), { env, cwd, windowsHide: true, maxBuffer: 64 * 1024 * 1024, timeout: timeoutSeconds * 1000, killSignal: "SIGKILL" });
  const timedOut = result.error?.code === "ETIMEDOUT";
  if (result.error && !timedOut) fail(`cannot execute ${argv[0]}: ${result.error.message}`);
  return { stdout: result.stdout ?? Buffer.alloc(0), stderr: result.stderr ?? Buffer.alloc(0), status: result.status, timedOut };
}
function section(id, body, status, timedOut) {
  const exit = status === null ? "signal" : String(status);
  const text = body.toString("utf8");
  return `beskid-release-case begin test=${id}\n${text}${text.length && !text.endsWith("\n") ? "\n" : ""}beskid-release-case end test=${id} exit=${exit} timed_out=${timedOut}\n`;
}

export function ProduceReleaseCases(options) {
  const definition = PLATFORMS[options.platform] ?? fail("unsupported platform");
  const { target } = definition;
  const output = options.output;
  const buildResult = JSON.parse(readFileSync(join(output, "woodpecker-build-result.json"), "utf8"));
  if (buildResult.platform !== options.platform || buildResult.target !== target || buildResult.version !== options.version) fail("build result identity does not match the case run");
  if (!options.version.startsWith("0.6.")) fail("schema-2 release cases require release series 0.6");
  const manifestBytes = readFileSync(requireFile(options.manifest, "case manifest"));
  const manifest = ParseCanonicalManifest(manifestBytes);
  if (manifest.state !== "frozen") fail("case manifest is not frozen; run freeze-release-cases-v06.mjs first");
  if (!manifest.targets.includes(target)) fail(`case manifest does not require ${target}`);
  const manifestDigest = ManifestDigest(manifestBytes);

  // Installed candidate: the bundle must be complete on its own; nothing may fall back to a developer kit.
  const bundle = options.bundle;
  const executable = requireFile(join(bundle, "bin", definition.executable), "installed CLI");
  const corelib = join(bundle, "beskid_corelib");
  requireFile(join(corelib, "CoreLib.bws"), "installed Corelib workspace");
  const fingerprint = readFileSync(requireFile(join(corelib, ".beskid-bundle.sha256"), "installed Corelib fingerprint"), "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) fail("installed Corelib fingerprint is invalid");
  const kit = join(bundle, "lib", "beskid-runtime", "abi-5", target, "release");
  const abiPath = requireFile(join(kit, "abi.json"), "installed release runtime ABI");
  requireFile(join(bundle, "lib", "beskid-runtime", "abi-5", target, "debug", "abi.json"), "installed debug runtime ABI");
  if (!samePathSegments(buildResult.installed_cli ?? "", executable)) fail("build result installed_cli does not name the bundle CLI");
  const cliBytes = readFileSync(executable);
  const cliDigest = sha256(cliBytes);
  const assetBytes = readFileSync(requireFile(join(output, definition.cli), "versioned CLI asset"));
  if (!assetBytes.equals(cliBytes)) fail("bundle CLI differs from versioned CLI asset");
  const bundleAsset = `beskid-${options.version}-${target}.tar.gz`;
  const bundleDigest = sha256(readFileSync(requireFile(join(output, bundleAsset), "candidate bundle asset")));
  const kitReceipt = RuntimeKitReceiptBytes(kit);
  const kitDigest = sha256(kitReceipt);
  if (buildResult.runtime_kit_sha256 !== kitDigest) fail("bundle runtime-kit receipt digest does not match build result");
  const abiBytes = readFileSync(abiPath);
  if (buildResult.runtime_abi_sha256 !== sha256(abiBytes)) fail("bundle runtime ABI digest does not match build result");
  const existingKit = join(output, RUNTIME_KIT_RECEIPT);
  const runtime = lstatSync(existingKit, { throwIfNoEntry: false }) ? { path: RUNTIME_KIT_RECEIPT, sha256: sha256(readFileSync(existingKit)) } : retain(output, RUNTIME_KIT_RECEIPT, kitReceipt);
  if (runtime.sha256 !== kitDigest) fail("retained runtime-kit receipt differs from the bundle");
  const abi = retain(output, RUNTIME_ABI_RECEIPT, abiBytes);
  const fingerprintFile = retain(output, CORELIB_FINGERPRINT_FILE, `${fingerprint}\n`);
  retain(output, MANIFEST_FILE, manifestBytes);
  const installedReceipt = {
    prefix: bundle, target, source: buildResult.source, version: options.version, runtime_kit_sha256: kitDigest, abi_sha256: abi.sha256,
    bundle_sha256: bundleDigest, corelib_fingerprint: fingerprint,
    cli: { relative_path: `bin/${definition.executable}`, packet_copy: definition.cli, sha256: cliDigest },
    files: [{ path: definition.cli, sha256: cliDigest }, { path: bundleAsset, sha256: bundleDigest }, runtime, abi, fingerprintFile],
  };
  const installed = retain(output, INSTALLED_RECEIPT, `${JSON.stringify(installedReceipt, null, 2)}\n`);

  // Harness and fixture executables built from the same commit, retained as flat packet files.
  const harnesses = {};
  for (const name of Object.keys(manifest.harness_executables ?? {})) {
    const file = harnessPacketName(name, target);
    harnesses[name] = retain(output, file, readFileSync(requireFile(join(options.harness, file), `harness executable ${name}`)), { executable: true });
  }
  const fixtures = {};
  for (const name of Object.keys(manifest.fixture_executables ?? {})) {
    const file = fixturePacketName(name, target);
    fixtures[name] = retain(output, file, readFileSync(requireFile(join(options.harness, file), `fixture executable ${name}`)), { executable: true });
  }

  // Retained sources and inputs are copied from the checkout and must match the frozen digests.
  const scratch = mkdtempSync(join(tmpdir(), "beskid-release-cases-"));
  try {
    const retainedSources = new Map();
    const inputs = new Map();
    for (const item of manifest.cases) {
      const binding = item.binding;
      if (!retainedSources.has(binding.harness_source.path)) {
        const bytes = readFileSync(requireFile(join(options.repo, binding.source_file), `${item.id} source`));
        if (sha256(bytes) !== binding.harness_source.sha256) fail(`${item.id} source ${binding.source_file} differs from the frozen manifest`);
        retainedSources.set(binding.harness_source.path, retain(output, binding.harness_source.path, bytes));
      }
      if (binding.input && !inputs.has(binding.input.id)) {
        const spec = InputSpec({ id: binding.input.id, source_root: binding.input.source_root, include: binding.input.include, corpus: binding.input.corpus }, `${item.id} input`);
        const archive = InputArchive(options.repo, spec);
        if (sha256(archive) !== binding.input.sha256) fail(`${item.id} input ${binding.input.source_root} differs from the frozen manifest`);
        retain(output, binding.input.path, archive);
        const root = join(scratch, "inputs", binding.input.id);
        mkdirSync(root, { recursive: true });
        // Name the archive relative to the packet directory: GNU tar (MSYS on the Windows agent) reads
        // an archive name like C:/... as a remote host:path, and bsdtar has no --force-local. Only the
        // -f name is parsed that way. The -C root uses forward slashes: MSYS tar mangles a Windows
        // path with backslashes (C:\WINDOWS\TEMP\...), and forward slashes are a no-op elsewhere.
        if (!/^[A-Za-z0-9._-]+$/.test(binding.input.path)) fail(`${item.id} input packet name is not a plain file name`);
        const extractRoot = root.split("\\").join("/");
        const extract = spawnSync("tar", ["-xf", binding.input.path, "-C", extractRoot], { cwd: output, encoding: "utf8", windowsHide: true });
        if (extract.error || extract.status !== 0) {
          fail(`cannot extract input ${binding.input.id}: status ${extract.status} ${extract.error?.message ?? ""} ${extract.stderr ?? ""}`.trim());
        }
        inputs.set(binding.input.id, root);
      }
    }

    const rows = [];
    const failures = [];
    // Retained case logs stay with the packet; the pipeline log gets a bounded tail of the first
    // failing assertions so a failure can be triaged when the packet is not handed off.
    const diagnostics = [];
    const diagnose = (label, ...streams) => {
      if (diagnostics.length >= 12) return;
      const text = streams.map(stream => stream.toString("utf8").split(/\r?\n/).slice(-40).join("\n")).join("\n").slice(-6000);
      diagnostics.push(`--- ${label} ---\n${text}`);
    };
    for (const item of manifest.cases) {
      const binding = item.binding;
      const values = {
        installed_cli: executable, installed_prefix: bundle, installed_corelib: corelib,
        harness: binding.harness ? join(output, harnesses[binding.harness].path) : "",
        fixture: binding.fixture ? join(output, fixtures[binding.fixture].path) : "",
        input_root: binding.input ? inputs.get(binding.input.id) : "",
      };
      const command = substituteCommand(binding.command, values);
      const home = privateHome(scratch, `home-${item.id}`);
      const env = childEnvironment(home, command.env);
      const toolFile = binding.harness ? harnesses[binding.harness] : { path: definition.cli, sha256: cliDigest };
      let stdout, stderr, tests, exitCode = 0, timedOut = false;
      if (item.execution === "installed_native") {
        const result = run(command.argv, env, home, options.cellTimeout);
        stdout = result.stdout; stderr = result.stderr; exitCode = result.status; timedOut = result.timedOut;
        let passed = [];
        try { passed = nativeReportOutcomes(stdout, binding.target, item.id); } catch (error) { failures.push(`${item.id}: ${error.message}`); exitCode = exitCode === 0 ? 1 : exitCode; }
        tests = passed.map(id => ({ id, outcome: "passed" }));
        for (const id of binding.required_test_ids) if (!passed.includes(id)) failures.push(`${item.id}: required assertion ${id} did not pass`);
        if (binding.required_test_ids.some(id => !passed.includes(id))) diagnose(item.id, stdout, stderr);
      } else {
        const outParts = [], errParts = [];
        tests = [];
        for (const id of binding.required_test_ids) {
          const qualified = libtestPath(binding.source_file, manifest.harness_executables[binding.harness].source_root, id);
          const argv = command.argv.map(argument => argument.replaceAll("{test_id}", qualified));
          const result = run(argv, env, home, options.cellTimeout);
          outParts.push(section(id, result.stdout, result.status, result.timedOut));
          errParts.push(section(id, result.stderr, result.status, result.timedOut));
          let outcome = result.timedOut ? "timed_out" : libtestOutcome(result.stdout.toString("utf8").split("\n"), qualified);
          if (outcome === "passed" && result.status !== 0) outcome = "failed";
          const proven = result.stderr.toString("utf8").split(/\r?\n/).some(line => INVOCATION_LINE.test(line));
          if (outcome === "passed" && !proven) outcome = "not_executed";
          if (outcome !== "passed") { exitCode = result.status === 0 || result.status === null ? 1 : result.status; timedOut ||= result.timedOut; failures.push(`${item.id}: ${id} ${outcome}`); diagnose(`${item.id} ${id} ${outcome}`, result.stdout, result.stderr); }
          tests.push({ id, outcome });
        }
        stdout = Buffer.from(outParts.join(""), "utf8");
        stderr = Buffer.from(errParts.join(""), "utf8");
        parseSections(stdout.toString("utf8"), item.id);
      }
      if (stdout.length > OUTPUT_LIMIT || stderr.length > OUTPUT_LIMIT) failures.push(`${item.id}: bounded output exceeded`);
      const retainedStdout = retain(output, caseStdoutName(item.id), stdout);
      const retainedStderr = retain(output, caseStderrName(item.id), stderr);
      const artifact = binding.fixture ? fixtures[binding.fixture] : fingerprintFile;
      const row = {
        id: item.id, requirement_ids: item.requirement_ids, status: exitCode === 0 && !timedOut && tests.every(test => test.outcome === "passed") ? "success" : "failed",
        exit_code: exitCode, timed_out: timedOut, source: buildResult.source, target, runtime_kit_sha256: kitDigest,
        candidate_cli_sha256: cliDigest, candidate_bundle_sha256: bundleDigest, harness_source: binding.harness_source,
        command: { argv: command.argv, tool_file: command.tool_file, tool_sha256: toolFile.sha256, version: `${toolFile.path}@${toolFile.sha256}`, installed_cli: executable, env: command.env },
        input_sha256: binding.input ? binding.input.sha256 : null, artifact: artifact.path, artifact_sha256: artifact.sha256,
        stdout: retainedStdout.path, stdout_sha256: retainedStdout.sha256, stderr: retainedStderr.path, stderr_sha256: retainedStderr.sha256,
        tests, log: caseLogName(item.id),
      };
      const log = retain(output, row.log, JSON.stringify(row));
      row.log_sha256 = log.sha256;
      rows.push(row);
    }
    const passedIds = new Map(rows.map(row => [row.id, new Set(row.tests.filter(test => test.outcome === "passed").map(test => test.id))]));
    const rust_profile_matrix = [], obligation_matrix = [];
    for (const item of manifest.cases) {
      for (const proof of item.binding.profile_assertions ?? []) if (passedIds.get(item.id).has(proof.test_id)) rust_profile_matrix.push({ ...proof, case_id: item.id });
      for (const proof of item.binding.obligation_assertions ?? []) if (passedIds.get(item.id).has(proof.test_id)) obligation_matrix.push({ ...proof, case_id: item.id });
    }
    const feature = {
      schema_version: 2, version: options.version, target, source: buildResult.source, case_manifest_sha256: manifestDigest,
      runtime_kit: { sha256: kitDigest, abi_sha256: abi.sha256, receipt: runtime.path, abi_receipt: abi.path },
      installed_prefix: { path: bundle, receipt: installed.path, manifest_sha256: installed.sha256, fallback_used: false },
      cases: rows, rust_profile_matrix, obligation_matrix, not_applicable: { dotnet_glue: "stretch" },
    };
    writeFileSync(join(output, FEATURE_FILE), `${JSON.stringify(feature, null, 2)}\n`, { flag: "wx" });
    if (diagnostics.length) process.stderr.write(`${diagnostics.join("\n")}\n`);
    if (failures.length) fail(`${failures.length} release case failures:\n${failures.join("\n")}`);
    return { cases: rows.length, target };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = ProduceReleaseCases(parseArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`woodpecker release cases: ${error.message}\n`);
    process.exit(1);
  }
}

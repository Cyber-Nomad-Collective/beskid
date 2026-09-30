import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const validatorPath = new URL("../woodpecker-release-evidence.mjs", import.meta.url);
const aggregatePath = new URL("../woodpecker-aggregate-release.mjs", import.meta.url);
const packagePath = new URL("../woodpecker-package-platform.mjs", import.meta.url);
const featureProducerPath = new URL("../woodpecker-feature-evidence.mjs", import.meta.url);
const runtimeDigestPath = new URL("../woodpecker-runtime-kit-digest.mjs", import.meta.url);

test("Windows packaging derives all installer artwork from the distribution generator", () => {
  const source = readFileSync(packagePath, "utf8");
  const generator = source.indexOf('"windows/generate-brand-assets.sh"');
  const msi = source.indexOf('"windows/build-msi.sh"');
  const exe = source.indexOf('"windows/build-exe.sh"');
  assert.ok(generator >= 0, "packager must call the distribution brand generator");
  assert.ok(generator < msi && msi < exe, "generate assets before MSI and EXE packaging");
  assert.doesNotMatch(source, /"magick"/, "packager must not maintain a second artwork recipe");
});
const SOURCE = {
  superrepo_commit: "a".repeat(40),
  compiler_commit: "b".repeat(40),
};
const VERSION = "0.4.744";
const PLATFORMS = {
  linux: {
    target: "x86_64-unknown-linux-gnu",
    cli: "beskid-linux-amd64",
    lsp: "beskid_lsp-linux-amd64",
  },
  macos: {
    target: "aarch64-apple-darwin",
    cli: "beskid-darwin-arm64",
    lsp: "beskid_lsp-darwin-arm64",
  },
  windows: {
    target: "x86_64-pc-windows-msvc",
    cli: "beskid-windows-amd64.exe",
    lsp: "beskid_lsp-windows-amd64.exe",
  },
};
const FEATURE_CASES = [
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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writePlatform(root, platform, overrides = {}, source = SOURCE, version = VERSION) {
  const definition = PLATFORMS[platform];
  const directory = join(root, platform);
  mkdirSync(directory, { recursive: true });
  const bundle = `beskid-${version}-${definition.target}.tar.gz`;
  const resultName = `platform-result-${definition.target}.json`;
  const buildResultName = "woodpecker-build-result.json";
  const platformResult = {
    schema_version: 1,
    target: definition.target,
    stage: "native-release-build",
    builds: {
      cli: { status: "success", asset: definition.cli },
      lsp: { status: "success", asset: definition.lsp },
      bundle: { status: "success", asset: bundle },
    },
    diagnostics: [],
    ...overrides.platformResult,
  };
  const buildResult = {
    schema_version: 1,
    platform,
    target: definition.target,
    version,
    channel: "stable",
    source,
    runtime_kit_sha256: sha256(`${platform}-runtime-kit`),
    platform_result_status: "success",
    published: false,
    ...overrides.buildResult,
  };
  writeJson(join(directory, resultName), platformResult);
  writeJson(join(directory, buildResultName), buildResult);
  const files = {
    [definition.cli]: `${platform}-cli`,
    [definition.lsp]: `${platform}-lsp`,
    [bundle]: `${platform}-bundle`,
    [resultName]: `${JSON.stringify(platformResult, null, 2)}\n`,
    [buildResultName]: `${JSON.stringify(buildResult, null, 2)}\n`,
  };
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(directory, name), content);
  }
  const sums = Object.entries(files)
    .map(([name, content]) => `${sha256(content)}  ${name}`)
    .join("\n");
  writeFileSync(join(directory, "SHA256SUMS"), `${sums}\n`);
  return directory;
}

function createFixture(overrides = {}, { includeFeatures = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "beskid-woodpecker-evidence-"));
  const source = overrides.source ?? SOURCE;
  const version = overrides.version ?? VERSION;
  for (const platform of Object.keys(PLATFORMS)) {
    writePlatform(root, platform, overrides[platform] ?? {}, source, version);
  }
  if (includeFeatures) {
    for (const platform of Object.keys(PLATFORMS)) writeFeatureFixture(root, platform);
  }
  return root;
}

function writeGateFixture(root) {
  for (const [component, stage] of [["compiler", "rust-gate"], ["corelib", "matrix"]]) {
    const log = `release-gate-${component}.log`;
    const content = `${component} gate fixture passed\n`;
    writeFileSync(join(root, "linux", log), content);
    writeJson(join(root, "linux", `release-gate-${component}.json`), {
      schema_version: 1, component, stage, platform: "linux", version: VERSION,
      source: SOURCE, status: "success", exit_code: 0, command: "fixture gate",
      raw_log: log, raw_log_sha256: sha256(content),
    });
  }
}

function writeFeatureFixture(root, platform) {
  const buildResult = JSON.parse(readFileSync(join(root, platform, "woodpecker-build-result.json"), "utf8"));
  const featureName = "feature-evidence-v1.json";
  const cases = FEATURE_CASES.map(([id, target]) => {
    const logName = `feature-${id.replaceAll(".", "-")}.json`;
    const log = `${JSON.stringify({ target, summary: { passed: 1, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 }, tests: [{ qualified_name: `${target}.passes`, outcome: "passed" }] })}\n`;
    writeFileSync(join(root, platform, logName), log);
    return { id, target, status: "success", log: logName, log_sha256: sha256(log), test_ids: [`${target}.passes`] };
  });
  const kitSha = sha256(`${platform}-runtime-kit`);
  const feature = {
    schema_version: 1,
    platform,
    target: PLATFORMS[platform].target,
    version: buildResult.version,
    source: buildResult.source,
    runtime_kit: { profile: "release", target: PLATFORMS[platform].target, sha256: buildResult.runtime_kit_sha256, abi_sha256: sha256(`${platform}-abi`) },
    cases,
    not_applicable: { glue: { status: "not_applicable", reason: GLUE_REASON } },
  };
  writeJson(join(root, platform, featureName), {
    ...feature,
  });
  const sumsPath = join(root, platform, "SHA256SUMS");
  const oldLines = readFileSync(sumsPath, "utf8").trim().split("\n");
  oldLines.push(`${sha256(readFileSync(join(root, platform, featureName)))}  ${featureName}`);
  for (const item of cases) oldLines.push(`${sha256(readFileSync(join(root, platform, item.log)))}  ${item.log}`);
  writeFileSync(sumsPath, `${oldLines.join("\n")}\n`);
}

function updateChecksum(directory, name) {
  const path = join(directory, "SHA256SUMS");
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  const index = lines.findIndex(line => line.endsWith(`  ${name}`));
  assert.notEqual(index, -1, `fixture checksum exists for ${name}`);
  lines[index] = `${sha256(readFileSync(join(directory, name)))}  ${name}`;
  writeFileSync(path, `${lines.join("\n")}\n`);
}

function runValidator(root) {
  return spawnSync(process.execPath, [validatorPath.pathname, root], {
    encoding: "utf8",
  });
}

function createPackageFixture() {
  const repo = new URL("../../../", import.meta.url).pathname;
  const source = {
    superrepo_commit: spawnSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim(),
    compiler_commit: spawnSync("git", ["-C", repo, "rev-parse", "HEAD:compiler"], { encoding: "utf8" }).stdout.trim(),
  };
  const overrides = {};
  for (const platform of Object.keys(PLATFORMS)) overrides[platform] = { buildResult: { source } };
  return { root: createFixture(overrides), source };
}

test("packaging rejects legacy flat bundles instead of reporting an installer success", (t) => {
  const { root } = createPackageFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [packagePath.pathname, "linux", root, join(root, "packages")], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /bundle extraction failed/);
  assert.equal(existsSync(join(root, "packages", "package-result.json")), false);
});

test("packaging rejects invalid evidence before creating output", (t) => {
  const root = createFixture({ linux: { buildResult: { platform_result_status: "failed" } } });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, "packages");
  const result = spawnSync(process.execPath, [packagePath.pathname, "linux", root, output], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /platform_result_status/);
  assert.equal(existsSync(output), false);
});

test("native packaging consumes the complete verified bundle", { skip: !["darwin", "linux"].includes(process.platform) }, (t) => {
  const platform = process.platform === "darwin" ? "macos" : "linux";
  const { root, source } = createPackageFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const target = PLATFORMS[platform].target;
  const name = `beskid-${VERSION}-${target}`;
  const stage = join(root, "staging");
  const bundle = join(stage, name);
  for (const dir of ["bin", `lib/beskid-runtime/abi-5/${target}/debug`, `lib/beskid-runtime/abi-5/${target}/release`, "beskid_corelib/beskid_corelib", "beskid_corelib/packages"]) mkdirSync(join(bundle, dir), { recursive: true });
  for (const binary of ["beskid", "beskid_lsp", "beskid-up"]) writeFileSync(join(bundle, "bin", binary), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  writeFileSync(join(bundle, "beskid_corelib/.beskid-bundle.sha256"), `${"0".repeat(64)}\n`);
  writeFileSync(join(bundle, "beskid_corelib/CoreLib.bws"), "fixture\n");
  writeFileSync(join(bundle, "beskid_corelib/beskid_corelib/corelib.bproj"), "fixture\n");
  writeFileSync(join(bundle, `lib/beskid-runtime/abi-5/${target}/debug/abi.json`), "{}\n");
  writeFileSync(join(bundle, `lib/beskid-runtime/abi-5/${target}/release/abi.json`), "{}\n");
  writeFileSync(join(bundle, "release-version.txt"), `${VERSION}\n`);
  const archive = join(root, platform, `${name}.tar.gz`);
  const tar = spawnSync("tar", ["-czf", archive, "-C", stage, name], { encoding: "utf8" });
  assert.equal(tar.status, 0, tar.stderr);
  const sumsPath = join(root, platform, "SHA256SUMS");
  const sums = readFileSync(sumsPath, "utf8").trim().split("\n").map(line => {
    const file = line.slice(66);
    return `${sha256(readFileSync(join(root, platform, file)))}  ${file}`;
  });
  writeFileSync(sumsPath, `${sums.join("\n")}\n`);
  const output = join(root, "packages");
  const result = spawnSync(process.execPath, [packagePath.pathname, platform, root, output], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(readFileSync(join(output, "package-result.json")));
  assert.equal(report.status, "success");
  assert.equal(report.published, false);
  assert.deepEqual(report.source, source);
  assert.equal(report.artifacts[0].sha256, sha256(readFileSync(join(output, report.artifacts[0].name))));
  if (platform === "macos") {
    const formula = readFileSync(join(output, "beskid.rb"), "utf8");
    assert.ok(formula.includes(`/v${VERSION}/${name}.tar.gz`));
    assert.ok(formula.includes(sha256(readFileSync(archive))));
  }
});

test("packaging rejects evidence for another checkout before output creation", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, "packages");
  const result = spawnSync(process.execPath, [packagePath.pathname, "linux", root, output], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /checkout does not match/);
  assert.equal(existsSync(output), false);
});

test("aggregation refuses to qualify native builds without compiler and Corelib gate reports", (t) => {
  const root = createFixture();
  const output = join(root, "aggregate");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const args = [aggregatePath.pathname, root, output, VERSION, SOURCE.superrepo_commit, SOURCE.compiler_commit];
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release-gate-compiler.json/);
  const again = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.notEqual(again.status, 0, "must not replace an existing transaction");
});

test("aggregation carries source-bound gate logs into qualified release state", (t) => {
  const root = createFixture();
  writeGateFixture(root);
  const output = join(root, "aggregate");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [aggregatePath.pathname, root, output, VERSION, SOURCE.superrepo_commit, SOURCE.compiler_commit], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(readFileSync(join(output, "release-state.json")));
  assert.equal(state.publishable, true);
  assert.deepEqual(state.tests.successful, ["compiler:rust-gate", "corelib:matrix", "linux:native-build", "macos:native-build", "windows:native-build"]);
  assert.equal(state.tests.results.find(entry => entry.component === "corelib").raw_log_sha256,
    sha256("corelib gate fixture passed\n"));
  assert.equal(readFileSync(join(output, "gate-reports", "release-gate-corelib.log"), "utf8"), "corelib gate fixture passed\n");
  assert.equal(existsSync(join(output, "evidence", "linux", "feature-evidence-v1.json")), true);
  const validated = JSON.parse(readFileSync(join(output, "validated-evidence.json"), "utf8"));
  assert.equal(validated.platforms[0].features.cases.length, FEATURE_CASES.length);
});

for (const [name, mutate, expected] of [
  ["stale gate source", root => {
    const path = join(root, "linux", "release-gate-corelib.json");
    const report = JSON.parse(readFileSync(path, "utf8"));
    report.source.compiler_commit = "c".repeat(40);
    writeJson(path, report);
  }, /source-matched compiler Rust and Corelib matrix reports/],
  ["symlinked gate report", root => {
    const path = join(root, "linux", "release-gate-corelib.json");
    const external = join(root, "external-corelib.json");
    writeFileSync(external, readFileSync(path));
    rmSync(path);
    symlinkSync(external, path);
  }, /invalid release gate artifact/],
  ["tampered gate log", root => {
    writeFileSync(join(root, "linux", "release-gate-corelib.log"), "altered after gate execution\n");
  }, /source-matched compiler Rust and Corelib matrix reports/],
]) {
  test(`aggregation rejects ${name} before qualification`, (t) => {
    const root = createFixture();
    writeGateFixture(root);
    mutate(root);
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, "aggregate");
    const result = spawnSync(process.execPath, [aggregatePath.pathname, root, output, VERSION, SOURCE.superrepo_commit, SOURCE.compiler_commit], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
    if (existsSync(join(output, "release-state.json"))) {
      assert.equal(JSON.parse(readFileSync(join(output, "release-state.json"))).publishable, false);
    }
  });
}

test("aggregation rejects wrong requested source and failed evidence before creating output", (t) => {
  const root = createFixture();
  const output = join(root, "aggregate");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [aggregatePath.pathname, root, output, VERSION, "c".repeat(40), SOURCE.compiler_commit], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requested release source\/version/);
  assert.equal(existsSync(output), false);
  rmSync(join(root, "windows", "beskid-windows-amd64.exe"));
  const failed = spawnSync(process.execPath, [aggregatePath.pathname, root, output, VERSION, SOURCE.superrepo_commit, SOURCE.compiler_commit], { encoding: "utf8" });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /missing required artifact/);
  assert.equal(existsSync(output), false);
});

test("accepts complete matching platform, feature and gate evidence", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runValidator(root);

  assert.equal(result.status, 0, result.stderr);
  const evidence = JSON.parse(result.stdout);
  assert.equal(evidence.schema_version, 1);
  assert.equal(evidence.version, VERSION);
  assert.deepEqual(evidence.source, SOURCE);
  assert.deepEqual(evidence.platforms.map(({ platform }) => platform), ["linux", "macos", "windows"]);
  assert.equal(evidence.platforms[0].features.cases[0].id, "foundations.core_bytes");
  assert.equal(evidence.platforms[0].features.not_applicable.glue.status, "not_applicable");
});

test("rejects build-only platform handoffs without feature evidence", (t) => {
  const root = createFixture({}, { includeFeatures: false });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runValidator(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SHA256SUMS is missing feature-evidence-v1\.json/);
});

test("rejects source, version, and target drift in feature evidence", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const featurePath = join(root, "linux", "feature-evidence-v1.json");
  const feature = JSON.parse(readFileSync(featurePath, "utf8"));
  feature.version = "9.9.9";
  writeJson(featurePath, feature);
  let result = runValidator(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /feature evidence version does not match/);

  feature.version = VERSION;
  feature.source.compiler_commit = "c".repeat(40);
  writeJson(featurePath, feature);
  result = runValidator(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /feature source\.compiler_commit does not match linux/);

  feature.source = SOURCE;
  feature.target = "aarch64-apple-darwin";
  writeJson(featurePath, feature);
  result = runValidator(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /feature evidence target does not match/);
});

test("rejects unexecuted cases and a false Glue not-applicable reason", (t) => {
  const unexecutedRoot = createFixture();
  const glueRoot = createFixture();
  const featurePath = join(unexecutedRoot, "linux", "feature-evidence-v1.json");
  const feature = JSON.parse(readFileSync(featurePath, "utf8"));
  feature.cases[0].test_ids = [];
  writeJson(featurePath, feature);
  const gluePath = join(glueRoot, "linux", "feature-evidence-v1.json");
  const glue = JSON.parse(readFileSync(gluePath, "utf8"));
  glue.not_applicable.glue.reason = "not implemented";
  writeJson(gluePath, glue);
  t.after(() => {
    rmSync(unexecutedRoot, { recursive: true, force: true });
    rmSync(glueRoot, { recursive: true, force: true });
  });
  const unexecuted = runValidator(unexecutedRoot);
  const notApplicable = runValidator(glueRoot);
  assert.notEqual(unexecuted.status, 0);
  assert.match(unexecuted.stderr, /has no unique executed test IDs/);
  assert.notEqual(notApplicable.status, 0);
  assert.match(notApplicable.stderr, /Glue not_applicable reason does not match/);
});

test("validator rejects skipped tests and inconsistent summary counts", (t) => {
  const skippedRoot = createFixture(), inconsistentRoot = createFixture();
  for (const [root, mutate] of [
    [skippedRoot, log => ({ ...log, summary: { passed: 1, failed: 0, skipped: 1, filtered_out: 0, timed_out: 0 }, tests: [...log.tests, { qualified_name: "NetworkDnsTests.skips", outcome: "skipped" }] })],
    [inconsistentRoot, log => ({ ...log, summary: { passed: 2, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 } })],
  ]) {
    const directory = join(root, "linux"), logName = "feature-network-dns.json";
    const log = JSON.parse(readFileSync(join(directory, logName), "utf8"));
    writeJson(join(directory, logName), mutate(log));
    const featurePath = join(directory, "feature-evidence-v1.json");
    const feature = JSON.parse(readFileSync(featurePath, "utf8"));
    feature.cases.find(item => item.id === "network.dns").log_sha256 = sha256(readFileSync(join(directory, logName)));
    writeJson(featurePath, feature);
    updateChecksum(directory, logName);
    updateChecksum(directory, "feature-evidence-v1.json");
  }
  t.after(() => {
    rmSync(skippedRoot, { recursive: true, force: true });
    rmSync(inconsistentRoot, { recursive: true, force: true });
  });
  const skipped = runValidator(skippedRoot), inconsistent = runValidator(inconsistentRoot);
  assert.notEqual(skipped.status, 0);
  assert.match(skipped.stderr, /contains skipped, filtered, timed-out, or failed tests/);
  assert.notEqual(inconsistent.status, 0);
  assert.match(inconsistent.stderr, /summary counts do not match tests/);
});

test("native producer records all target results and binds the release runtime kit", (t) => {
  const root = mkdtempSync(join(tmpdir(), "beskid-feature-producer-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, "output"), bundle = join(root, "bundle");
  mkdirSync(output); mkdirSync(join(bundle, "beskid_corelib"), { recursive: true });
  mkdirSync(join(bundle, "bin"), { recursive: true });
  mkdirSync(join(bundle, "lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/release"), { recursive: true });
  writeFileSync(join(bundle, "beskid_corelib/CoreLib.bws"), "fixture\n");
  const bundledKit = join(bundle, "lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/release");
  writeFileSync(join(bundledKit, "abi.json"), "{}\n");
  const bundledCli = join(bundle, "bin/beskid");
  const cliContents = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[args.indexOf("--target-timeout") + 1] !== "900") process.exit(91);
const target = args[args.indexOf("--target") + 1];
const report = { target, summary: { passed: 1, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 }, tests: [{ qualified_name: target + ".passes", outcome: "passed" }] };
if (target === "CoreBytesTests") report.padding = "x".repeat(2 * 1024 * 1024);
process.stdout.write(JSON.stringify(report) + String.fromCharCode(10));
`;
  writeFileSync(bundledCli, cliContents, { mode: 0o755 });
  writeFileSync(join(output, "beskid"), "#!/bin/sh\nexit 91\n", { mode: 0o755 });
  const digest = spawnSync(process.execPath, [runtimeDigestPath.pathname, bundledKit], { encoding: "utf8" });
  assert.equal(digest.status, 0, digest.stderr);
  writeJson(join(output, "woodpecker-build-result.json"), {
    platform: "linux", target: PLATFORMS.linux.target, version: VERSION, source: SOURCE,
    runtime_kit_sha256: digest.stdout.trim(),
  });
  const result = spawnSync(process.execPath, [featureProducerPath.pathname, "linux", VERSION, output, bundle], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const feature = JSON.parse(readFileSync(join(output, "feature-evidence-v1.json"), "utf8"));
  assert.equal(feature.cases.length, FEATURE_CASES.length);
  assert.deepEqual(feature.cases.map(item => item.id), FEATURE_CASES.map(([id]) => id));
  assert.equal(feature.runtime_kit.sha256, digest.stdout.trim());
  assert.equal(feature.runtime_kit.abi_sha256, sha256("{}\n"));
  assert.equal(feature.cases[0].test_ids[0], "CoreBytesTests.passes", "the bundled CLI, not output/beskid, must be executed");
  assert.ok(readFileSync(join(output, feature.cases[0].log)).length > 1024 * 1024, "reports larger than Node's default buffer must be retained");
});

test("native producer rejects a bundle runtime-kit mismatch", (t) => {
  const root = mkdtempSync(join(tmpdir(), "beskid-feature-kit-mismatch-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, "output"), bundle = join(root, "bundle"), stagedKit = join(root, "staged-kit");
  mkdirSync(output); mkdirSync(join(bundle, "beskid_corelib"), { recursive: true });
  mkdirSync(join(bundle, "bin"), { recursive: true });
  const kitPath = join(bundle, "lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/release");
  mkdirSync(kitPath, { recursive: true }); mkdirSync(stagedKit, { recursive: true });
  writeFileSync(join(bundle, "beskid_corelib/CoreLib.bws"), "fixture\n");
  writeFileSync(join(kitPath, "abi.json"), "bundled kit\n");
  writeFileSync(join(stagedKit, "abi.json"), "staged kit\n");
  const fakeCli = join(bundle, "bin/beskid");
  writeFileSync(fakeCli, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  const stagedDigest = spawnSync(process.execPath, [runtimeDigestPath.pathname, stagedKit], { encoding: "utf8" });
  assert.equal(stagedDigest.status, 0, stagedDigest.stderr);
  writeJson(join(output, "woodpecker-build-result.json"), { platform: "linux", target: PLATFORMS.linux.target, version: VERSION, source: SOURCE, runtime_kit_sha256: stagedDigest.stdout.trim() });
  const result = spawnSync(process.execPath, [featureProducerPath.pathname, "linux", VERSION, output, bundle], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /bundle runtime-kit digest does not match build result/);
});

test("native producer rejects skipped test records even when one test passes", (t) => {
  const root = mkdtempSync(join(tmpdir(), "beskid-feature-skipped-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, "output"), bundle = join(root, "bundle");
  mkdirSync(output); mkdirSync(join(bundle, "beskid_corelib"), { recursive: true });
  mkdirSync(join(bundle, "bin"), { recursive: true });
  const kitPath = join(bundle, "lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/release");
  mkdirSync(kitPath, { recursive: true });
  writeFileSync(join(bundle, "beskid_corelib/CoreLib.bws"), "fixture\n"); writeFileSync(join(kitPath, "abi.json"), "{}\n");
  const fakeCli = join(bundle, "bin/beskid");
  const report = "{\"target\":\"CoreBytesTests\",\"summary\":{\"passed\":1,\"failed\":0,\"skipped\":1,\"filtered_out\":0,\"timed_out\":0},\"tests\":[{\"qualified_name\":\"CoreBytesTests.passes\",\"outcome\":\"passed\"},{\"qualified_name\":\"CoreBytesTests.skips\",\"outcome\":\"skipped\"}]}";
  writeFileSync(fakeCli, `#!/bin/sh\nprintf '%s\\n' '${report}'\n`, { mode: 0o755 });
  writeFileSync(join(output, "beskid"), "#!/bin/sh\nexit 91\n", { mode: 0o755 });
  const digest = spawnSync(process.execPath, [runtimeDigestPath.pathname, kitPath], { encoding: "utf8" });
  const runtimeDigest = digest.stdout.trim();
  writeJson(join(output, "woodpecker-build-result.json"), { platform: "linux", target: PLATFORMS.linux.target, version: VERSION, source: SOURCE, runtime_kit_sha256: runtimeDigest });
  const result = spawnSync(process.execPath, [featureProducerPath.pathname, "linux", VERSION, output, bundle], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /contains skipped, filtered, timed-out, or failed tests/);
  assert.equal(existsSync(join(output, "feature-evidence-v1.json")), false);
});

test("rejects missing cases, identity drift, and modified feature logs", (t) => {
  const missingCase = createFixture();
  const identityDrift = createFixture();
  const tamperedLog = createFixture();
  const missingPath = join(missingCase, "linux", "feature-evidence-v1.json");
  const missingRecord = JSON.parse(readFileSync(missingPath));
  missingRecord.cases = [];
  writeJson(missingPath, missingRecord);
  const identityPath = join(identityDrift, "windows", "feature-evidence-v1.json");
  const identityRecord = JSON.parse(readFileSync(identityPath));
  identityRecord.runtime_kit.sha256 = "f".repeat(64);
  writeJson(identityPath, identityRecord);
  writeJson(join(tamperedLog, "macos", "feature-network-tcp.json"), {
    target: "NetworkTcpTests", summary: { passed: 1, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 }, tampered: true,
    tests: [{ qualified_name: "NetworkTcpTests.passes", outcome: "passed" }],
  });
  t.after(() => {
    rmSync(missingCase, { recursive: true, force: true });
    rmSync(identityDrift, { recursive: true, force: true });
    rmSync(tamperedLog, { recursive: true, force: true });
  });
  const missing = runValidator(missingCase);
  const identity = runValidator(identityDrift);
  const tampered = runValidator(tamperedLog);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /missing required conformance cases/);
  assert.notEqual(identity.status, 0);
  assert.match(identity.stderr, /runtime-kit digest does not match build result/);
  assert.notEqual(tampered.status, 0);
  assert.match(tampered.stderr, /checksum mismatch for feature-network-tcp\.json/);
});

test("rejects mismatched source provenance", (t) => {
  const root = createFixture({
    windows: { buildResult: { source: { ...SOURCE, compiler_commit: "c".repeat(40) } } },
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runValidator(root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /windows source\.compiler_commit does not match linux/);
});

test("rejects a failed native build", (t) => {
  const root = createFixture({ linux: { buildResult: { platform_result_status: "failed" } } });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runValidator(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /platform_result_status/);
});

test("rejects missing artifacts and tampered checksums", (t) => {
  const missingRoot = createFixture();
  const tamperedRoot = createFixture();
  rmSync(join(missingRoot, "macos", "beskid-darwin-arm64"));
  writeFileSync(join(tamperedRoot, "linux", "beskid-linux-amd64"), "tampered");
  t.after(() => {
    rmSync(missingRoot, { recursive: true, force: true });
    rmSync(tamperedRoot, { recursive: true, force: true });
  });

  const missing = runValidator(missingRoot);
  const tampered = runValidator(tamperedRoot);

  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /macos missing required artifact beskid-darwin-arm64/);
  assert.notEqual(tampered.status, 0);
  assert.match(tampered.stderr, /linux checksum mismatch for beskid-linux-amd64/);
});

test("rejects checksums for files outside the declared evidence set", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const path = join(root, "linux", "SHA256SUMS");
  writeFileSync(path, readFileSync(path, "utf8") + `${"0".repeat(64)}  undeclared.txt\n`);
  const result = runValidator(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /undeclared checksum/);
});

test("rejects source commits that are not lowercase 40-character hashes", (t) => {
  const root = createFixture({ source: { ...SOURCE, compiler_commit: "invalid" } });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runValidator(root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /linux source\.compiler_commit must be a lowercase 40-character hexadecimal Git commit/);
});

test("rejects symlinked platform directories, metadata, and artifacts", (t) => {
  const platformRoot = createFixture();
  const metadataRoot = createFixture();
  const artifactRoot = createFixture();
  const external = mkdtempSync(join(tmpdir(), "beskid-woodpecker-outside-"));
  const artifactTarget = join(external, "beskid-linux-amd64");
  writeFileSync(artifactTarget, "outside");
  rmSync(join(platformRoot, "windows"), { recursive: true, force: true });
  symlinkSync(external, join(platformRoot, "windows"));
  rmSync(join(metadataRoot, "linux", "woodpecker-build-result.json"));
  symlinkSync(artifactTarget, join(metadataRoot, "linux", "woodpecker-build-result.json"));
  rmSync(join(artifactRoot, "linux", "beskid-linux-amd64"));
  symlinkSync(artifactTarget, join(artifactRoot, "linux", "beskid-linux-amd64"));
  t.after(() => {
    rmSync(platformRoot, { recursive: true, force: true });
    rmSync(metadataRoot, { recursive: true, force: true });
    rmSync(artifactRoot, { recursive: true, force: true });
    rmSync(external, { recursive: true, force: true });
  });

  const platform = runValidator(platformRoot);
  const metadata = runValidator(metadataRoot);
  const artifact = runValidator(artifactRoot);

  assert.notEqual(platform.status, 0);
  assert.match(platform.stderr, /windows platform directory must not be a symbolic link/);
  assert.notEqual(metadata.status, 0);
  assert.match(metadata.stderr, /linux build result must not be a symbolic link/);
  assert.notEqual(artifact.status, 0);
  assert.match(artifact.stderr, /linux artifact beskid-linux-amd64 must not be a symbolic link/);
});

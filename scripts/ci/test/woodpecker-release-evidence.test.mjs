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

function createFixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "beskid-woodpecker-evidence-"));
  const source = overrides.source ?? SOURCE;
  const version = overrides.version ?? VERSION;
  for (const platform of Object.keys(PLATFORMS)) {
    writePlatform(root, platform, overrides[platform] ?? {}, source, version);
  }
  writeJson(join(root, "gate-evidence.json"), {
    schema_version: 1,
    source,
    version,
    checks: [
      { name: "compiler-rust", status: "success" },
      { name: "corelib", status: "success" },
      { name: "openspec", status: "success" },
      { name: "editor", status: "success" },
    ],
    ...overrides.gates,
  });
  return root;
}

function runValidator(root) {
  return spawnSync(process.execPath, [validatorPath.pathname, root], {
    encoding: "utf8",
  });
}

test("packaging rejects legacy flat bundles instead of reporting an installer success", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [packagePath.pathname, "linux", root, join(root, "packages")], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /bundle extraction failed/);
  assert.equal(existsSync(join(root, "packages", "package-result.json")), false);
});

test("packaging rejects invalid evidence before creating output", (t) => {
  const root = createFixture({ gates: { checks: [] } });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, "packages");
  const result = spawnSync(process.execPath, [packagePath.pathname, "linux", root, output], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /gate evidence/);
  assert.equal(existsSync(output), false);
});

test("native packaging consumes the complete verified bundle", { skip: !["darwin", "linux"].includes(process.platform) }, (t) => {
  const platform = process.platform === "darwin" ? "macos" : "linux";
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const target = PLATFORMS[platform].target;
  const name = `beskid-${VERSION}-${target}`;
  const stage = join(root, "staging");
  const bundle = join(stage, name);
  for (const dir of ["bin", `lib/beskid-runtime/abi-5/${target}/release`, "beskid_corelib", "packages"]) mkdirSync(join(bundle, dir), { recursive: true });
  for (const binary of ["beskid", "beskid_lsp", "beskid-up"]) writeFileSync(join(bundle, "bin", binary), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  writeFileSync(join(bundle, "beskid_corelib/corelib.bproj"), "fixture\n");
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
  assert.deepEqual(report.source, SOURCE);
  assert.equal(report.artifacts[0].sha256, sha256(readFileSync(join(output, report.artifacts[0].name))));
  if (platform === "macos") {
    const formula = readFileSync(join(output, "beskid.rb"), "utf8");
    assert.ok(formula.includes(`/v${VERSION}/${name}.tar.gz`));
    assert.ok(formula.includes(sha256(readFileSync(archive))));
  }
});

test("aggregation snapshots validated artifacts and records only observed gates", (t) => {
  const root = createFixture();
  const output = join(root, "aggregate");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const args = [aggregatePath.pathname, root, output, VERSION, SOURCE.superrepo_commit, SOURCE.compiler_commit];
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(readFileSync(join(output, "release-state.json")));
  assert.equal(state.publishable, true);
  assert.deepEqual(state.tests.successful, ["compiler-rust:gate", "corelib:gate", "editor:gate", "openspec:gate"]);
  assert.equal(state.complete_platforms.length, 3);
  assert.equal(readFileSync(join(output, "assets", "beskid-linux-amd64"), "utf8"), "linux-cli");
  const manifest = JSON.parse(readFileSync(join(output, "assets", "beskid-release.json")));
  assert.equal(manifest.commit, SOURCE.compiler_commit);
  assert.equal(manifest.bundles.length, 3);
  const again = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.notEqual(again.status, 0, "must not replace an existing transaction");
});

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

test("accepts complete matching platform and gate evidence", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runValidator(root);

  assert.equal(result.status, 0, result.stderr);
  const evidence = JSON.parse(result.stdout);
  assert.equal(evidence.schema_version, 1);
  assert.equal(evidence.version, VERSION);
  assert.deepEqual(evidence.source, SOURCE);
  assert.deepEqual(evidence.platforms.map(({ platform }) => platform), ["linux", "macos", "windows"]);
  assert.deepEqual(evidence.gates.map(({ name }) => name), ["compiler-rust", "corelib", "openspec", "editor"]);
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

test("rejects a failed required gate and an empty check list", (t) => {
  const failedRoot = createFixture({
    gates: {
      checks: [
        { name: "compiler-rust", status: "success" },
        { name: "corelib", status: "success" },
        { name: "openspec", status: "success" },
        { name: "editor", status: "failed" },
      ],
    },
  });
  const emptyRoot = createFixture({ gates: { checks: [] } });
  t.after(() => {
    rmSync(failedRoot, { recursive: true, force: true });
    rmSync(emptyRoot, { recursive: true, force: true });
  });

  const failed = runValidator(failedRoot);
  const empty = runValidator(emptyRoot);

  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /gate editor must have status success/);
  assert.notEqual(empty.status, 0);
  assert.match(empty.stderr, /gate evidence checks must be a non-empty array/);
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

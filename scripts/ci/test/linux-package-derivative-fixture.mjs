import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cliSurfaceFixture } from "./cli-surface-fixture.mjs";

export const SOURCE = { superrepo_commit: "a".repeat(40), compiler_commit: "b".repeat(40) };
export const VERSION = "1.2.3";
export const TARGET = "x86_64-unknown-linux-gnu";
export const IMAGE = `docker.io/library/ubuntu@sha256:${"e".repeat(64)}`;
export const CHECKS = ["clang", "cc", "ar", "ranlib", "libc-header-c-probe", "analyze", "locked-build", "locked-run", "lockfile-unchanged"];
const PLATFORMS = {
  linux: { target: TARGET, cli: "beskid-linux-amd64", lsp: "beskid_lsp-linux-amd64" },
  macos: { target: "aarch64-apple-darwin", cli: "beskid-darwin-arm64", lsp: "beskid_lsp-darwin-arm64" },
  windows: { target: "x86_64-pc-windows-msvc", cli: "beskid-windows-amd64.exe", lsp: "beskid_lsp-windows-amd64.exe" },
};
const FEATURE_CASES = [
  ["foundations.core_bytes", "CoreBytesTests"], ["foundations.encoding_utf8", "CoreEncodingUtf8Tests"], ["foundations.time", "SystemTimeTests"],
  ["foundations.fibers", "ConcurrencyFiberHandleTests"], ["foundations.channels", "ConcurrencyChannelApiTests"], ["network.types", "NetworkTypesTests"],
  ["network.dns", "NetworkDnsTests"], ["network.tcp", "NetworkTcpTests"], ["network.udp", "NetworkUdpTests"], ["network.scope", "NetworkScopeTests"],
  ["network.shutdown", "NetworkShutdownLeakTests"], ["network.disposable", "NetworkDisposableTests"], ["http.codec", "HttpCodecTests"],
  ["http.validation", "HttpValidationTests"], ["http.serialization", "HttpSerializationTests"], ["http.exchange", "HttpExchangeTests"],
];
const GLUE_REASON = "Glue bindings are outside the v0.5 release contract; generated Rust/.NET bindings remain deferred to v0.6.";

export function sha(value) { return createHash("sha256").update(value).digest("hex"); }
export function json(path, value) { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }

function writePlatform(root, platform) {
  const definition = PLATFORMS[platform];
  const directory = join(root, platform);
  mkdirSync(directory, { recursive: true });
  const bundle = `beskid-${VERSION}-${definition.target}.tar.gz`;
  const platformResultName = `platform-result-${definition.target}.json`;
  const platformResult = { schema_version: 1, target: definition.target, stage: "native-release-build", builds: {
    cli: { status: "success", asset: definition.cli }, lsp: { status: "success", asset: definition.lsp }, bundle: { status: "success", asset: bundle },
  }, diagnostics: [] };
  const buildResult = { schema_version: 1, platform, target: definition.target, version: VERSION, channel: "stable", source: SOURCE,
    runtime_kit_sha256: sha(`${platform}-runtime-kit`), ...(platform === "linux" ? { corelib_fingerprint: "d".repeat(64) } : {}),
    platform_result_status: "success", published: false };
  const files = new Map([
    [definition.cli, `${platform}-cli`], [definition.lsp, `${platform}-lsp`], [bundle, `${platform}-bundle`],
    [platformResultName, `${JSON.stringify(platformResult, null, 2)}\n`], ["woodpecker-build-result.json", `${JSON.stringify(buildResult, null, 2)}\n`],
  ]);
  const cases = FEATURE_CASES.map(([id, target]) => {
    const log = `feature-${id.replaceAll(".", "-")}.json`;
    const contents = `${JSON.stringify({ target, summary: { passed: 1, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 }, tests: [{ qualified_name: `${target}.passes`, outcome: "passed" }] })}\n`;
    files.set(log, contents);
    return { id, target, status: "success", log, log_sha256: sha(contents), test_ids: [`${target}.passes`] };
  });
  files.set("feature-evidence-v1.json", `${JSON.stringify({ schema_version: 1, platform, target: definition.target, version: VERSION, source: SOURCE,
    runtime_kit: { profile: "release", target: definition.target, sha256: buildResult.runtime_kit_sha256, abi_sha256: sha(`${platform}-abi`) }, cases,
    not_applicable: { glue: { status: "not_applicable", reason: GLUE_REASON } } }, null, 2)}\n`);
  for (const [name, contents] of files) writeFileSync(join(directory, name), contents);
  if (platform === "linux") {
    const binary = join(directory, definition.cli);
    json(join(directory, "cli-surface-evidence-v1.json"), cliSurfaceFixture(binary, sha(readFileSync(binary)), buildResult.corelib_fingerprint));
    const receipt = spawnSync(process.execPath, [new URL("../woodpecker-cli-surface-evidence.mjs", import.meta.url).pathname, "create",
      join(directory, "cli-surface-evidence-v1.json"), binary, join(directory, "cli-surface-receipt-v1.json"), VERSION,
      SOURCE.superrepo_commit, SOURCE.compiler_commit, buildResult.runtime_kit_sha256, buildResult.corelib_fingerprint], { encoding: "utf8" });
    assert.equal(receipt.status, 0, receipt.stderr);
    files.set("cli-surface-evidence-v1.json", readFileSync(join(directory, "cli-surface-evidence-v1.json")));
    files.set("cli-surface-receipt-v1.json", readFileSync(join(directory, "cli-surface-receipt-v1.json")));
  }
  writeFileSync(join(directory, "SHA256SUMS"), `${[...files].map(([name, contents]) => `${sha(contents)}  ${name}`).join("\n")}\n`);
}

function createNativeAggregate(root) {
  const evidence = join(root, "evidence");
  for (const platform of Object.keys(PLATFORMS)) writePlatform(evidence, platform);
  const validation = spawnSync(process.execPath, [new URL("../woodpecker-release-evidence.mjs", import.meta.url).pathname, evidence], { encoding: "utf8" });
  assert.equal(validation.status, 0, validation.stderr);
  const validated = JSON.parse(validation.stdout);
  json(join(root, "validated-evidence.json"), validated);
  json(join(root, "release-state.json"), { version: VERSION, publishable: true, provenance: SOURCE });
  const assets = join(root, "assets");
  mkdirSync(assets);
  for (const platform of validated.platforms) for (const artifact of platform.artifacts.filter(item => !item.name.endsWith(".json"))) {
    cpSync(join(evidence, platform.platform, artifact.name), join(assets, artifact.name));
  }
  writeFileSync(join(assets, "beskid-release.json"), "{}\n");
  mkdirSync(join(root, "gate-reports", "stages"), { recursive: true });
}

function git(root, ...args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function createRecipe(root) {
  mkdirSync(root); writeFileSync(join(root, "base"), "base\n"); git(root, "init"); git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "user.name", "Test"); git(root, "add", "."); git(root, "commit", "-m", "base"); const base = git(root, "rev-parse", "HEAD");
  mkdirSync(join(root, "deb")); mkdirSync(join(root, "tests/fixtures/deb-console/Src"), { recursive: true });
  const files = { "deb/build-deb.sh": "#!/bin/sh\n", "tests/deb-toolchain-install.test.sh": "#!/bin/bash\nset -euo pipefail\n",
    "tests/fixtures/deb-console/probe.c": "#include <stdio.h>\nint main(void) { puts(\"ok\"); return 0; }\n",
    "tests/fixtures/deb-console/Smoke.bproj": "[project]\nname = \"Smoke\"\n", "tests/fixtures/deb-console/Src/Main.bd": "fn Main() -> I32 { 0 }\n" };
  for (const [name, contents] of Object.entries(files)) writeFileSync(join(root, name), contents);
  git(root, "add", "."); git(root, "commit", "-m", "recipe");
  return { base, commit: git(root, "rev-parse", "HEAD"), files };
}

function redTrace(harnessSha) { return [`QUALIFICATION_START phase=red image=${IMAGE} harness_sha256=${harnessSha}`, "+ set -euo pipefail",
  "+ DEBIAN_FRONTEND=noninteractive", "+ apt-get install -y --no-install-recommends /input/beskid-1.2.3-amd64.deb",
  "+ echo 'DEB did not install required tool: clang'", "DEB did not install required tool: clang", "+ exit 1", "QUALIFICATION_EXIT phase=red exit_code=1", ""].join("\n"); }
function greenTrace(harnessSha) { return [`QUALIFICATION_START phase=green image=${IMAGE} harness_sha256=${harnessSha}`, "+ set -euo pipefail",
  "+ [[ ubuntu == ubuntu ]]", "+ [[ 24.04 == 24.04 ]]", "+ [[ x86_64 == x86_64 ]]", "+ DEBIAN_FRONTEND=noninteractive",
  "+ apt-get install -y --no-install-recommends /input/beskid-1.2.3-amd64.deb", "+ command -v clang", "/usr/bin/clang", "+ command -v cc", "/usr/bin/cc",
  "+ command -v ar", "/usr/bin/ar", "+ command -v ranlib", "/usr/bin/ranlib", "+ cp /test/tests/fixtures/deb-console/probe.c /tmp/work/probe.c",
  "+ clang -target x86_64-unknown-linux-gnu -std=c11 -fPIC -c /tmp/work/probe.c -o /tmp/work/probe.o", "+ ar rcs /tmp/work/probe.a /tmp/work/probe.o",
  "+ ranlib /tmp/work/probe.a", "+ cc /tmp/work/probe.a -o /tmp/work/probe", "+ /tmp/work/probe", "+ cp -a /test/tests/fixtures/deb-console/. /tmp/work/project/",
  "+ /usr/bin/beskid check --project Smoke.bproj --plain", "Analysis complete in 1ms", "+ sha256sum Project.lock",
  "+ /usr/bin/beskid build --project Smoke.bproj --locked --plain", "Build complete in 1ms", "+ /usr/bin/beskid run --project Smoke.bproj --locked --plain",
  "Run complete in 1ms", "  exit: 0", "+ sha256sum --check /tmp/work/lock.sha256", "Project.lock: OK", "Clean DEB toolchain install and AOT build/run: PASS",
  "QUALIFICATION_EXIT phase=green exit_code=0", ""].join("\n"); }

export function createDerivativeFixture(root) {
  const native = join(root, "native"), recipe = join(root, "recipe"), qualified = join(root, "qualified");
  mkdirSync(native); mkdirSync(qualified); createNativeAggregate(native); const recipeIdentity = createRecipe(recipe);
  const artifactName = `beskid-${VERSION}-amd64.deb`, artifact = "corrected deb\n"; writeFileSync(join(qualified, artifactName), artifact);
  const harness = recipeIdentity.files["tests/deb-toolchain-install.test.sh"], red = redTrace(sha(harness)), green = greenTrace(sha(harness));
  writeFileSync(join(qualified, "red.log"), red); writeFileSync(join(qualified, "green.log"), green);
  const intent = { schema_version: 1, kind: "linux-package-derivative-correction", version: VERSION, platform: "linux", target: TARGET,
    native: { ...SOURCE, bundle: { name: `beskid-${VERSION}-${TARGET}.tar.gz`, sha256: sha("linux-bundle") },
      release_state_sha256: sha(readFileSync(join(native, "release-state.json"))), validated_evidence_sha256: sha(readFileSync(join(native, "validated-evidence.json"))) },
    recipe: { distribution_commit: recipeIdentity.commit, base_distribution_commit: recipeIdentity.base, entrypoint: "deb/build-deb.sh" },
    artifact: { name: artifactName, sha256: sha(artifact) }, record: { name: `${artifactName}.correction-v1.json` },
    qualification: { environment: { os: "ubuntu", version: "24.04", architecture: "amd64", install_mode: "apt-get --no-install-recommends", container_image: IMAGE },
      harness: { path: "tests/deb-toolchain-install.test.sh", sha256: sha(harness) }, fixture: {
        project: { path: "tests/fixtures/deb-console/Smoke.bproj", sha256: sha(recipeIdentity.files["tests/fixtures/deb-console/Smoke.bproj"]) },
        source: { path: "tests/fixtures/deb-console/Src/Main.bd", sha256: sha(recipeIdentity.files["tests/fixtures/deb-console/Src/Main.bd"]) },
        c_probe: { path: "tests/fixtures/deb-console/probe.c", sha256: sha(recipeIdentity.files["tests/fixtures/deb-console/probe.c"]) } },
      red: { log: "red.log", sha256: sha(red), expected_failure: "DEB did not install required tool: clang", exit_code: 1 },
      green: { log: "green.log", sha256: sha(green), required_checks: CHECKS, exit_code: 0 } } };
  const intentPath = join(root, "intent.json"); json(intentPath, intent);
  return { root, native, recipe, qualified, intent, intentPath, artifact, red, green, recipeIdentity };
}

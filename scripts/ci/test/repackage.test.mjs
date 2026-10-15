import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { BundleCacheViolations, PruneBundleCaches } from "../lib/bundle-caches.mjs";
import { ClippyOnlyFailure, VerifyRepackage, WriteRepackageHandoff } from "../lib/repackage.mjs";
import { ReadUploadComplete, ValidateHandoff } from "../woodpecker-handoff.mjs";

const KEY = "c6f41294d3c605315e57ce670a3084567c3fac17e9aa83bb6b24f26bb09c217f";
const COMPILER = "1".repeat(40), BSOL = "2".repeat(40), DISTRIB = "3".repeat(40), NEW_DISTRIB = "4".repeat(40);
const sha256 = value => createHash("sha256").update(value).digest("hex");
const manifest = JSON.parse(readFileSync(new URL("../release-cases-v06.json", import.meta.url), "utf8"));

function temp(t, prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function write(root, path, content = "x\n") {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), content);
}
function files(root, relative = "") {
  return readdirSync(join(root, relative), { withFileTypes: true }).flatMap(entry => {
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    return entry.isDirectory() ? files(root, path) : [path];
  });
}

// ---------------------------------------------------------------------------------------------
// Cache exclusion

function bundleWithCaches(t) {
  const root = temp(t, "bundle-caches-");
  const sealed = `beskid_corelib/mods/serialization_mod/.beskid/obj/mods/serialization_mod/${KEY}/x86_64-pc-windows-msvc`;
  for (const path of [
    "bin/beskid.exe", "release-version.txt", "beskid_corelib/CoreLib.bws", "beskid_corelib/.beskid-bundle.sha256",
    "beskid_corelib/mods/serialization_mod/serialization_mod.bproj", "beskid_corelib/mods/serialization_mod/Project.lock",
    "beskid_corelib/mods/serialization_mod/Src/Mod.bd",
    `${sealed}/mod.descriptor.json`, `${sealed}/mod.dll`, `${sealed}/sources/Project.lock`,
    `${sealed}/sdk/src/Beskid/Syntax/Nodes/SpannedEnumConstructorExpression.bd`,
    // Caches the Mod prebuild leaves behind, and a test project's output.
    "beskid_corelib/mods/serialization_mod/.beskid/obj/mods/serialization_mod/.cache-lock",
    "beskid_corelib/mods/serialization_mod/obj/beskid/.materialize-lock",
    "beskid_corelib/mods/serialization_mod/obj/beskid/cache/salsa/db.json",
    "beskid_corelib/mods/serialization_mod/obj/beskid/cache/salsa/units/00bf5ae0a9a01c5a/ast.bin",
    "beskid_corelib/mods/serialization_mod/obj/beskid/deps/src/corelib_foundation-36af/src/Core.bd",
    "beskid_corelib/beskid_corelib/tests/corelib_tests/obj/main/corelib_tests.o",
    "beskid_corelib/beskid_corelib/tests/corelib_tests/src/Tests.bd",
    "beskid_corelib/packages/foundation/.beskid/obj/units/cache.bin",
    // A Mod cache entry without a descriptor is a partial build, not a shipped artifact.
    `beskid_corelib/mods/corelib_pest_gen/.beskid/obj/mods/corelib_pest_gen/${KEY}/x86_64-pc-windows-msvc/mod.o`,
  ]) write(root, path);
  return { root, sealed };
}

test("cache exclusion removes Mod build state, Salsa caches and test outputs but keeps the sealed Mod entry", (t) => {
  const { root, sealed } = bundleWithCaches(t);
  const before = files(root);
  assert.equal(BundleCacheViolations(before).length, 7, "the fixture contains caches; the descriptor-less entry is caught by pruning");
  const removed = PruneBundleCaches(root);
  assert.ok(removed.includes("beskid_corelib/mods/serialization_mod/obj"));
  assert.ok(removed.includes("beskid_corelib/beskid_corelib/tests/corelib_tests/obj"));
  assert.ok(removed.includes("beskid_corelib/mods/serialization_mod/.beskid/obj/mods/serialization_mod/.cache-lock"));
  const after = files(root);
  assert.deepEqual(BundleCacheViolations(after), []);
  for (const kept of [`${sealed}/mod.descriptor.json`, `${sealed}/mod.dll`, `${sealed}/sources/Project.lock`,
    `${sealed}/sdk/src/Beskid/Syntax/Nodes/SpannedEnumConstructorExpression.bd`,
    "beskid_corelib/mods/serialization_mod/Project.lock", "beskid_corelib/mods/serialization_mod/Src/Mod.bd",
    "beskid_corelib/beskid_corelib/tests/corelib_tests/src/Tests.bd", "bin/beskid.exe"]) {
    assert.ok(after.includes(kept), `${kept} is shipped`);
  }
  assert.ok(!existsSync(join(root, "beskid_corelib/packages/foundation/.beskid")), "a .beskid without a sealed Mod entry is removed whole");
  assert.ok(!existsSync(join(root, "beskid_corelib/mods/corelib_pest_gen/.beskid")), "an entry without a descriptor is not shipped");
  assert.deepEqual(PruneBundleCaches(root), [], "pruning is idempotent");
});

test("cache detection lists every .beskid or obj path outside a sealed Mod entry", () => {
  const sealed = `beskid_corelib/mods/m/.beskid/obj/mods/m/${KEY}/x86_64-unknown-linux-gnu`;
  assert.deepEqual(BundleCacheViolations([
    `${sealed}/mod.descriptor.json`, `${sealed}/sources/obj/x.bd`, "bin/beskid", "beskid_corelib/x/objects/y.bd",
  ]), []);
  assert.deepEqual(BundleCacheViolations([
    "beskid_corelib/mods/m/obj/beskid/cache/salsa/db.json", "beskid_corelib/mods/m/.beskid/obj/mods/m/.cache-lock",
    `beskid_corelib/mods/m/.beskid/obj/mods/m/short-key/x86_64-unknown-linux-gnu/mod.o`, `obj/${sealed}/mod.descriptor.json`,
  ]).length, 4);
});

// ---------------------------------------------------------------------------------------------
// Compiler gate: clippy-only failures

const CLIPPY_LOG = `no legacy type-system patterns in compiler .rs sources
==> Clippy (timeout: 600s)
    Checking beskid_execution v0.6.0
error: unsafe function's docs are missing a \`# Safety\` section
  --> crates/beskid_execution/src/lib.rs:60:5
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.98.0/index.html#missing_safety_doc
   = note: \`-D clippy::missing-safety-doc\` implied by \`-D warnings\`

error: \`format!\` in \`format!\` args
   --> crates/beskid_execution/src/compiler_driver.rs:182:43
    = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.98.0/index.html#format_in_format_args

error: could not compile \`beskid_execution\` (lib) due to 2 previous errors
warning: build failed, waiting for other jobs to finish...
`;

test("a compiler gate that failed only on clippy lints is recognized", () => {
  assert.deepEqual(ClippyOnlyFailure(CLIPPY_LOG), { clippyOnly: true, findings: 2 });
});
test("a compiler gate that failed beyond clippy is not", () => {
  const rustc = CLIPPY_LOG.replace("error: `format!`", "error[E0308]: mismatched types\nerror: `format!`");
  assert.equal(ClippyOnlyFailure(rustc).clippyOnly, false);
  assert.equal(ClippyOnlyFailure(`${CLIPPY_LOG}==> Native ABI-v5 runtime-kit staging (timeout: 600s)\nerror: kit failed\n`).clippyOnly, false);
  assert.equal(ClippyOnlyFailure("legacy type-system pattern reintroduced: TypeContext\n").clippyOnly, false);
  assert.equal(ClippyOnlyFailure(CLIPPY_LOG.replace(/^error: `format!`[\s\S]*?(?=\n\nerror: could)/m, "error: linker `cc` not found")).clippyOnly, false);
  assert.equal(ClippyOnlyFailure("==> Clippy (timeout: 600s)\nerror: could not compile `x`\n").clippyOnly, false);
});

// ---------------------------------------------------------------------------------------------
// Repackage verification

function git(cwd, ...args) {
  const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function repository(t) {
  const repo = temp(t, "repackage-repo-");
  git(repo, "init", "-q"); git(repo, "config", "user.email", "repackage@example.invalid"); git(repo, "config", "user.name", "repackage");
  write(repo, "scripts/ci/release-cases-v06.json", "{\"cases\":[]}\n");
  write(repo, "scripts/ci/build-release-artifact.sh", "echo build\n");
  git(repo, "add", "scripts");
  for (const [sha, path] of [[COMPILER, "compiler"], [BSOL, "beskid_bsol"], [DISTRIB, "beskid_distrib"]]) git(repo, "update-index", "--add", "--cacheinfo", `160000,${sha},${path}`);
  git(repo, "commit", "-q", "-m", "C");
  const source = git(repo, "rev-parse", "HEAD");
  write(repo, "scripts/ci/woodpecker-package-platform.mjs", "// prune caches\n");
  git(repo, "add", "scripts");
  git(repo, "update-index", "--cacheinfo", `160000,${NEW_DISTRIB},beskid_distrib`);
  git(repo, "commit", "-q", "-m", "P");
  return { repo, source, head: git(repo, "rev-parse", "HEAD") };
}

const TARGETS = { linux: "x86_64-unknown-linux-gnu", windows: "x86_64-pc-windows-msvc" };
function buildOutput(t, source, platform, { compilerGate = "success", compilerLog = "==> Clippy\nok\n" } = {}) {
  const outputRoot = temp(t, "repackage-output-");
  const directory = join(outputRoot, `335-${source}`, platform);
  mkdirSync(directory, { recursive: true });
  const target = TARGETS[platform];
  const identity = { superrepo_commit: source, compiler_commit: COMPILER };
  const put = (name, value) => writeFileSync(join(directory, name), typeof value === "string" ? value : `${JSON.stringify(value)}\n`);
  put(`beskid-0.6.0-${target}.tar.gz`, "bundle");
  put("woodpecker-build-result.json", { schema_version: 1, platform, target, version: "0.6.0", channel: "stable", source: identity, platform_result_status: "success", published: false });
  put(`platform-result-${target}.json`, { schema_version: 1, target, stage: "native-release-build", builds: { bundle: { status: "success" }, cli: { status: "success" }, lsp: { status: "success" } }, diagnostics: [] });
  const cases = manifest.cases.map(item => ({ id: item.id, status: "success", exit_code: 0, timed_out: false }));
  put("feature-evidence-v2.json", { target, source: identity, cases });
  for (const item of cases) put(`case-${item.id}.json`, item);
  if (platform === "linux") {
    for (const [component, status, log] of [["corelib", "success", "matrix: 33/33 passed\n"], ["compiler", compilerGate, compilerLog]]) {
      put(`release-gate-${component}.log`, log);
      put(`release-gate-${component}.json`, { schema_version: 1, component, stage: component === "compiler" ? "rust-gate" : "matrix", platform: "linux", version: "0.6.0", source: identity, status, exit_code: status === "success" ? 0 : 101, command: "gate", raw_log: `release-gate-${component}.log`, raw_log_sha256: sha256(log) });
    }
  }
  reseal(directory);
  return { outputRoot, directory };
}
// A build records SHA256SUMS over its own outputs (the gate reports come later and are not listed).
function reseal(directory) {
  const names = readdirSync(directory).filter(name => !name.startsWith("release-gate-") && name !== "SHA256SUMS").sort();
  writeFileSync(join(directory, "SHA256SUMS"), names.map(name => `${sha256(readFileSync(join(directory, name)))}  ${name}\n`).join(""));
}
const accept = () => {};
function verify(t, platform, options = {}, override = {}) {
  const { repo, source, head } = repository(t);
  const { outputRoot, directory } = buildOutput(t, source, platform, options);
  const run = () => VerifyRepackage({ outputRoot, platform, build: "335", pipeline: "340", repo, head, validateEvidence: accept, ...override });
  return { repo, source, head, outputRoot, directory, run };
}

test("repackaging accepts a qualified Windows build and names the build and the repackaging root", (t) => {
  const { source, head, run } = verify(t, "windows");
  const verified = run();
  assert.equal(verified.source, source);
  assert.equal(verified.cases, manifest.cases.length);
  assert.deepEqual(verified.packaging, { source, packaging_commit: head, distrib_commit: NEW_DISTRIB });
  assert.equal(verified.gates, null);
  const handoff = join(verified.evidenceRoot, "windows-repackage-340");
  const provenance = WriteRepackageHandoff(verified, handoff, "335", "340");
  assert.deepEqual(provenance.build, { pipeline: 335, superrepo_commit: source, compiler_commit: COMPILER, release_cases_passed: manifest.cases.length });
  assert.deepEqual(provenance.packaged_by, { pipeline: 340, superrepo_commit: head, distrib_commit: NEW_DISTRIB });
  assert.ok(existsSync(join(handoff, "SHA256SUMS")) && existsSync(join(handoff, "repackage-provenance.json")));
  assert.throws(() => WriteRepackageHandoff(verified, handoff, "335", "340"), /already exists/);
});

test("repackaging rejects missing outputs", (t) => {
  const { outputRoot, repo, head, run } = verify(t, "windows");
  assert.throws(() => VerifyRepackage({ outputRoot, platform: "windows", build: "999", pipeline: "340", repo, head, validateEvidence: accept }), /expected exactly one build output 999-<commit>/);
  assert.throws(() => VerifyRepackage({ outputRoot, platform: "linux", build: "335", pipeline: "340", repo, head, validateEvidence: accept }), /missing linux outputs of build 335/);
  assert.throws(() => VerifyRepackage({ outputRoot, platform: "windows", build: "335", pipeline: "335", repo, head, validateEvidence: accept }), /other than the build pipeline/);
  assert.ok(run());
});
test("repackaging rejects a mismatched or missing checksum", (t) => {
  const { directory, run } = verify(t, "windows");
  writeFileSync(join(directory, "beskid-0.6.0-x86_64-pc-windows-msvc.tar.gz"), "tampered");
  assert.throws(run, /checksum mismatch: beskid-0\.6\.0-x86_64-pc-windows-msvc\.tar\.gz/);
  rmSync(join(directory, "beskid-0.6.0-x86_64-pc-windows-msvc.tar.gz"));
  assert.throws(run, /SHA256SUMS names a missing output/);
});
test("repackaging rejects a failed release case", (t) => {
  const { directory, run } = verify(t, "windows");
  const id = manifest.cases[3].id;
  const feature = JSON.parse(readFileSync(join(directory, "feature-evidence-v2.json"), "utf8"));
  feature.cases[3].status = "failed"; feature.cases[3].exit_code = 1;
  writeFileSync(join(directory, "feature-evidence-v2.json"), JSON.stringify(feature));
  reseal(directory);
  assert.throws(run, new RegExp(`release case ${id.replace(/\./g, "\\.")} did not pass`));
  feature.cases.pop();
  writeFileSync(join(directory, "feature-evidence-v2.json"), JSON.stringify(feature));
  reseal(directory);
  assert.throws(run, /release cases differ from the manifest/);
});
test("repackaging rejects a case record that did not pass", (t) => {
  const { directory, run } = verify(t, "windows");
  const id = manifest.cases[0].id;
  writeFileSync(join(directory, `case-${id}.json`), JSON.stringify({ id, status: "failed", exit_code: 1, timed_out: false }));
  reseal(directory);
  assert.throws(run, /did not pass/);
});
test("repackaging rejects a failed build, a foreign compiler, an earlier package and strict evidence failures", (t) => {
  const { directory, run } = verify(t, "windows");
  writeFileSync(join(directory, "package-result.json"), "{}\n");
  assert.throws(run, /already packaged/);
  rmSync(join(directory, "package-result.json"));
  assert.ok(run());
  const result = JSON.parse(readFileSync(join(directory, "woodpecker-build-result.json"), "utf8"));
  writeFileSync(join(directory, "woodpecker-build-result.json"), JSON.stringify({ ...result, source: { ...result.source, compiler_commit: "9".repeat(40) } }));
  reseal(directory);
  assert.throws(run, /is not the compiler pointer/);
  writeFileSync(join(directory, "woodpecker-build-result.json"), JSON.stringify({ ...result, platform_result_status: "failed" }));
  reseal(directory);
  assert.throws(run, /not a successful unpublished build/);
});
test("repackaging defers to the strict release evidence validator", (t) => {
  const { run } = verify(t, "windows", {}, { validateEvidence: () => { throw new Error("release evidence rejected: SHA256SUMS is missing x"); } });
  assert.throws(run, /release evidence rejected/);
});
test("repackaging rejects a root that changes build inputs", (t) => {
  const { repo, outputRoot } = verify(t, "windows");
  write(repo, "scripts/ci/build-release-artifact.sh", "echo changed\n");
  git(repo, "add", "scripts"); git(repo, "commit", "-q", "-m", "Q");
  const q = git(repo, "rev-parse", "HEAD");
  assert.throws(() => VerifyRepackage({ outputRoot, platform: "windows", build: "335", pipeline: "340", repo, head: q, validateEvidence: accept }), /changes inputs other than packaging/);
});

test("Linux repackaging accepts a clippy-only compiler gate failure and re-issues the report", (t) => {
  const { head, run } = verify(t, "linux", { compilerGate: "failed", compilerLog: CLIPPY_LOG });
  const verified = run();
  assert.equal(verified.gates.reissued, true);
  const report = verified.gates.report;
  assert.equal(report.status, "success");
  assert.equal(report.exit_code, 0);
  assert.equal(report.raw_log_sha256, sha256(CLIPPY_LOG), "the build's raw log stays the evidence");
  assert.deepEqual({ ...report.reissued, original_report_sha256: "" }, {
    rule: "clippy is report-only in the compiler release gate", original_status: "failed", original_exit_code: 101,
    original_report: "release-gate-compiler.build.json", original_report_sha256: "", clippy_findings: 2,
    phases_not_run: ["native runtime-kit staging", "compiler workspace tests"], by_pipeline: 340, by_commit: head,
  });
  const handoff = join(verified.evidenceRoot, "linux-repackage-340");
  WriteRepackageHandoff(verified, handoff, "335", "340");
  assert.equal(JSON.parse(readFileSync(join(handoff, "release-gate-compiler.build.json"), "utf8")).status, "failed");
  assert.equal(sha256(readFileSync(join(handoff, "release-gate-compiler.build.json"))), report.reissued.original_report_sha256);
  assert.equal(JSON.parse(readFileSync(join(handoff, "release-gate-compiler.json"), "utf8")).status, "success");
});
test("Linux repackaging rejects a compiler gate failure beyond clippy and a failed Corelib gate", (t) => {
  const { run } = verify(t, "linux", { compilerGate: "failed", compilerLog: CLIPPY_LOG.replace("error: `format!`", "error[E0425]: cannot find value\nerror: `format!`") });
  assert.throws(run, /the compiler gate failed beyond clippy: the log contains rustc compile errors/);
  const corelib = verify(t, "linux");
  const report = JSON.parse(readFileSync(join(corelib.directory, "release-gate-corelib.json"), "utf8"));
  writeFileSync(join(corelib.directory, "release-gate-corelib.json"), JSON.stringify({ ...report, status: "failed", exit_code: 1 }));
  assert.throws(corelib.run, /the Corelib gate did not pass/);
  writeFileSync(join(corelib.directory, "release-gate-corelib.log"), "edited\n");
  assert.throws(corelib.run, /corelib gate log does not match its report/);
});
test("Linux repackaging passes a successful compiler gate through unchanged", (t) => {
  const verified = verify(t, "linux").run();
  assert.equal(verified.gates.reissued, false);
  assert.equal(verified.gates.report.status, "success");
});

// ---------------------------------------------------------------------------------------------
// Handoff identity: the original build, plus packaged_by

function marker(t, lines) {
  const dir = temp(t, "repackage-marker-");
  writeFileSync(join(dir, "UPLOAD_COMPLETE"), lines.join("\n") + "\n");
  return join(dir, "UPLOAD_COMPLETE");
}
const BUILD = ["role=windows", `source=${"a".repeat(40)}`, `compiler=${"b".repeat(40)}`, "version=0.6.0", "pipeline=335"];
test("a repackaged UPLOAD_COMPLETE keeps the build identity and names the repackaging pipeline and commit", (t) => {
  const fields = ReadUploadComplete(marker(t, [...BUILD, "packaged_by=340", `packaged_by_commit=${"c".repeat(40)}`]));
  assert.equal(fields.pipeline, "335");
  assert.equal(fields.source, "a".repeat(40));
  assert.equal(fields.packaged_by, "340");
  assert.equal(fields.packaged_by_commit, "c".repeat(40));
  assert.throws(() => ReadUploadComplete(marker(t, [...BUILD, "packaged_by=340"])), /incomplete repackaging identity/);
  assert.throws(() => ReadUploadComplete(marker(t, [...BUILD, "packaged_by=335", `packaged_by_commit=${"c".repeat(40)}`])), /cannot be the build pipeline/);
  assert.throws(() => ReadUploadComplete(marker(t, [...BUILD, "packaged_by=x", `packaged_by_commit=${"c".repeat(40)}`])), /invalid UPLOAD_COMPLETE/);
});
test("a repackaged handoff validates against the build identity and reports packaged_by", (t) => {
  const dir = temp(t, "repackage-handoff-");
  writeFileSync(join(dir, "package-result.json"), "{}\n");
  writeFileSync(join(dir, "UPLOAD_SHA256SUMS"), `${sha256("{}\n")}  package-result.json\n`);
  writeFileSync(join(dir, "UPLOAD_COMPLETE"), [...BUILD, "packaged_by=340", `packaged_by_commit=${"c".repeat(40)}`].join("\n") + "\n");
  const result = ValidateHandoff(dir, { role: "windows", source: "a".repeat(40), compiler: "b".repeat(40), version: "0.6.0", pipeline: "335" });
  assert.equal(result.pipeline, 335);
  assert.equal(result.packaged_by, 340);
  assert.equal(result.packaged_by_commit, "c".repeat(40));
});

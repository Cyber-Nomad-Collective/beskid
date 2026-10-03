import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const verifier = new URL("../verify-linux-package-derivative.mjs", import.meta.url);
const sha = value => createHash("sha256").update(value).digest("hex");
const commit = char => char.repeat(40);
function json(path, value) { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "beskid-deb-derivative-"));
  const native = join(root, "native"); const recipe = join(root, "recipe"); const deb = join(root, "deb");
  mkdirSync(native); mkdirSync(recipe); mkdirSync(deb);
  const bundle = "bundle"; const state = { version: "1.2.3", publishable: true, provenance: { superrepo_commit: commit("a"), compiler_commit: commit("b") } }; const evidence = { version: "1.2.3", source: { superrepo_commit: commit("a"), compiler_commit: commit("b") }, platforms: [{ platform: "linux", target: "x86_64-unknown-linux-gnu", artifacts: [{ name: "beskid-1.2.3-x86_64-unknown-linux-gnu.tar.gz", sha256: sha(bundle) }] }] };
  json(join(native, "release-state.json"), state); json(join(native, "validated-evidence.json"), evidence); writeFileSync(join(native, "beskid-1.2.3-x86_64-unknown-linux-gnu.tar.gz"), bundle);
  writeFileSync(join(recipe, "base"), "base\n"); for (const args of [["init"], ["config", "user.email", "test@example.invalid"], ["config", "user.name", "Test"], ["add", "."], ["commit", "-m", "base"]]) assert.equal(spawnSync("git", ["-C", recipe, ...args], { encoding: "utf8" }).status, 0);
  const base = spawnSync("git", ["-C", recipe, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim(); mkdirSync(join(recipe, "deb")); writeFileSync(join(recipe, "deb/build-deb.sh"), "#!/bin/sh\n"); assert.equal(spawnSync("git", ["-C", recipe, "add", "."], { encoding: "utf8" }).status, 0); assert.equal(spawnSync("git", ["-C", recipe, "commit", "-m", "recipe"], { encoding: "utf8" }).status, 0); const recipeCommit = spawnSync("git", ["-C", recipe, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
  const artifact = "corrected deb"; writeFileSync(join(deb, "beskid-1.2.3-amd64.deb"), artifact);
  const red = "DEB did not install required tool: clang\n"; const green = "/usr/bin/clang\n/usr/bin/cc\n/usr/bin/ar\n/usr/bin/ranlib\nAnalysis complete in 1ms\nProject.lock: OK\nClean DEB toolchain install and AOT build/run: PASS\nBuild complete in 1ms\nRun complete in 1ms\n exit: 0\n"; writeFileSync(join(deb, "old.log"), red); writeFileSync(join(deb, "green.log"), green);
  const intent = { schema_version: 1, kind: "linux-package-derivative-correction", version: "1.2.3", platform: "linux", target: "x86_64-unknown-linux-gnu", native: { superrepo_commit: commit("a"), compiler_commit: commit("b"), bundle: { name: "beskid-1.2.3-x86_64-unknown-linux-gnu.tar.gz", sha256: sha(bundle) }, release_state_sha256: sha(readFileSync(join(native, "release-state.json"))), validated_evidence_sha256: sha(readFileSync(join(native, "validated-evidence.json"))) }, recipe: { distribution_commit: recipeCommit, base_distribution_commit: base, entrypoint: "deb/build-deb.sh" }, artifact: { name: "beskid-1.2.3-amd64.deb", sha256: sha(artifact) }, record: { name: "beskid-1.2.3-amd64.deb.correction-v1.json" }, qualification: { environment: { os: "ubuntu", version: "24.04", architecture: "amd64", install_mode: "apt-get --no-install-recommends", image_digests: ["docker.io/library/ubuntu@sha256:" + "e".repeat(64)] }, red: { log: "old.log", sha256: sha(red), expected_failure: "DEB did not install required tool: clang" }, green: { log: "green.log", sha256: sha(green), required_checks: ["clang", "cc", "ar", "ranlib", "libc-header-c-probe", "analyze", "locked-build", "locked-run", "lockfile-unchanged"] } } };
  const intentPath = join(root, "intent.json"); json(intentPath, intent); return { root, native, recipe, deb, intentPath };
}
function run(f, output = join(f.root, "out")) { return { output, result: spawnSync(process.execPath, [verifier.pathname, f.intentPath, f.native, f.recipe, f.deb, output], { encoding: "utf8" }) }; }
test("verifier creates an append-only correction record from exact regular inputs", t => { const f = fixture(); t.after(() => rmSync(f.root, { recursive: true, force: true })); const { result, output } = run(f); assert.equal(result.status, 0, result.stderr); const record = JSON.parse(readFileSync(join(output, "beskid-1.2.3-amd64.deb.correction-v1.json"))); assert.equal(record.artifact.sha256, sha("corrected deb")); assert.deepEqual(Object.keys(record).sort(), ["artifact", "kind", "native", "platform", "qualification", "recipe", "schema_version", "version"]); });
test("verifier rejects a symlinked DEB before creating output", t => { const f = fixture(); t.after(() => rmSync(f.root, { recursive: true, force: true })); const file = join(f.deb, "beskid-1.2.3-amd64.deb"); writeFileSync(join(f.deb, "actual"), "corrected deb"); rmSync(file); symlinkSync(join(f.deb, "actual"), file); const { result, output } = run(f); assert.notEqual(result.status, 0); assert.match(result.stderr, /regular file|symbolic link/); assert.throws(() => readFileSync(output)); });

import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CHECKS, createDerivativeFixture, json, sha } from "./linux-package-derivative-fixture.mjs";

const verifier = new URL("../verify-linux-package-derivative.mjs", import.meta.url);

function fixture(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), "beskid-deb-derivative-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return createDerivativeFixture(root);
}
function run(value, output = join(value.root, "out")) {
  return { output, result: spawnSync(process.execPath, [verifier.pathname, value.intentPath, value.native, value.recipe, value.qualified, output], { encoding: "utf8" }) };
}
function rewriteIntent(value, mutate) { mutate(value.intent); json(value.intentPath, value.intent); }
function expectRejectedBeforeOutput(value, pattern, output = join(value.root, "out")) {
  const result = run(value, output).result;
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, pattern);
  assert.equal(existsSync(output), false, `unexpected output left at ${output}`);
}

test("verifier snapshots the exact correction and qualification evidence into a private append-only output", t => {
  const value = fixture(t);
  const nativeBefore = new Map([
    ["release-state.json", readFileSync(join(value.native, "release-state.json"))],
    ["validated-evidence.json", readFileSync(join(value.native, "validated-evidence.json"))],
    [value.intent.native.bundle.name, readFileSync(join(value.native, "assets", value.intent.native.bundle.name))],
  ]);
  const { result, output } = run(value);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(lstatSync(output).mode & 0o777, 0o700);
  assert.deepEqual(readFileSync(join(output, value.intent.artifact.name)), Buffer.from(value.artifact));
  assert.equal(readFileSync(join(output, "qualification", "red.log"), "utf8"), value.red);
  assert.equal(readFileSync(join(output, "qualification", "green.log"), "utf8"), value.green);
  const record = JSON.parse(readFileSync(join(output, value.intent.record.name), "utf8"));
  assert.deepEqual(Object.keys(record).sort(), ["artifact", "kind", "native", "platform", "qualification", "recipe", "schema_version", "target", "version"]);
  assert.deepEqual(record.qualification, value.intent.qualification);
  assert.equal(existsSync(join(output, "release-state.json")), false);
  assert.equal(existsSync(join(output, "validated-evidence.json")), false);
  assert.equal(existsSync(join(output, "package-result.json")), false);
  for (const [name, contents] of nativeBefore) {
    const path = name.endsWith(".tar.gz") ? join(value.native, "assets", name) : join(value.native, name);
    assert.deepEqual(readFileSync(path), contents, `native input changed: ${name}`);
  }
});

test("verifier refuses to reuse an existing output directory", t => {
  const value = fixture(t), output = join(value.root, "out");
  mkdirSync(output);
  const result = run(value, output).result;
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already exists|exclusive|EEXIST/);
});

test("verifier accepts a later finite correction-record revision without release-specific code", t => {
  const value = fixture(t);
  rewriteIntent(value, intent => { intent.record.name = `${intent.artifact.name}.correction-v2.json`; });
  const { result, output } = run(value);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(output, value.intent.record.name)), true);
});

test("verifier rejects a source covered by the repository publication hold policy", t => {
  const value = fixture(t);
  rewriteIntent(value, intent => {
    intent.version = "0.5.1";
    intent.native.compiler_commit = "1bd7bdee81d59ef14339e6a6c2ce18eb36585238";
    intent.native.bundle.name = "beskid-0.5.1-x86_64-unknown-linux-gnu.tar.gz";
    intent.artifact.name = "beskid-0.5.1-amd64.deb";
    intent.record.name = "beskid-0.5.1-amd64.deb.correction-v1.json";
  });
  expectRejectedBeforeOutput(value, /publication hold/i);
});

for (const [name, mutate, pattern] of [
  ["native source drift", value => { value.intent.native.superrepo_commit = "c".repeat(40); json(value.intentPath, value.intent); }, /source|superrepo/i],
  ["native compiler drift", value => { value.intent.native.compiler_commit = "c".repeat(40); json(value.intentPath, value.intent); }, /source|compiler/i],
  ["native bundle drift", value => { writeFileSync(join(value.native, "assets", value.intent.native.bundle.name), "replaced"); }, /bundle|digest|checksum/i],
  ["native release-state drift", value => { const path = join(value.native, "release-state.json"); writeFileSync(path, `${readFileSync(path)} `); }, /release-state|aggregate digest/i],
  ["native validated-evidence drift", value => { const path = join(value.native, "validated-evidence.json"); writeFileSync(path, `${readFileSync(path)} `); }, /validated-evidence|aggregate digest/i],
  ["recipe commit drift", value => { writeFileSync(join(value.recipe, "later"), "later\n"); spawnSync("git", ["-C", value.recipe, "add", "."]); spawnSync("git", ["-C", value.recipe, "commit", "-m", "later"]); }, /focused recipe commit/i],
  ["base recipe drift", value => { rewriteIntent(value, intent => { intent.recipe.base_distribution_commit = "c".repeat(40); }); }, /parent|base/i],
  ["package replacement", value => { writeFileSync(join(value.qualified, value.intent.artifact.name), "replaced"); }, /DEB.*digest|artifact.*digest/i],
  ["missing RED", value => { rmSync(join(value.qualified, value.intent.qualification.red.log)); }, /qualified.*inventory|RED.*missing/i],
  ["missing GREEN", value => { rmSync(join(value.qualified, value.intent.qualification.green.log)); }, /qualified.*inventory|GREEN.*missing/i],
  ["wrong RED digest", value => { rewriteIntent(value, intent => { intent.qualification.red.sha256 = "0".repeat(64); }); }, /RED.*digest/i],
  ["wrong GREEN digest", value => { rewriteIntent(value, intent => { intent.qualification.green.sha256 = "0".repeat(64); }); }, /GREEN.*digest/i],
  ["missing GREEN assertion", value => { const path = join(value.qualified, value.intent.qualification.green.log); const text = readFileSync(path, "utf8").replace("+ ranlib /tmp/work/probe.a\n", ""); writeFileSync(path, text); rewriteIntent(value, intent => { intent.qualification.green.sha256 = sha(text); }); }, /ranlib|required assertion/i],
  ["missing GREEN tool command", value => { const path = join(value.qualified, value.intent.qualification.green.log); const text = readFileSync(path, "utf8").replace("+ command -v clang", "+ true"); writeFileSync(path, text); rewriteIntent(value, intent => { intent.qualification.green.sha256 = sha(text); }); }, /clang|required assertion/i],
  ["wrong RED phase", value => { const path = join(value.qualified, value.intent.qualification.red.log); const text = readFileSync(path, "utf8").replace("phase=red", "phase=green"); writeFileSync(path, text); rewriteIntent(value, intent => { intent.qualification.red.sha256 = sha(text); }); }, /RED.*trace|phase/i],
  ["missing RED failure assertion", value => { const path = join(value.qualified, value.intent.qualification.red.log); const text = readFileSync(path, "utf8").replaceAll("DEB did not install required tool: clang", "different failure"); writeFileSync(path, text); rewriteIntent(value, intent => { intent.qualification.red.sha256 = sha(text); }); }, /RED.*expected failure/i],
  ["wrong GREEN exit", value => { const path = join(value.qualified, value.intent.qualification.green.log); const text = readFileSync(path, "utf8").replace("phase=green exit_code=0", "phase=green exit_code=1"); writeFileSync(path, text); rewriteIntent(value, intent => { intent.qualification.green.sha256 = sha(text); }); }, /GREEN.*exit/i],
  ["unclean recipe", value => { writeFileSync(join(value.recipe, "untracked"), "dirty\n"); }, /clean/i],
]) test(`verifier rejects ${name} before output creation`, t => { const value = fixture(t); mutate(value); expectRejectedBeforeOutput(value, pattern); });

for (const [name, relative, pattern] of [
  ["aggregate release-state", "release-state.json", /release-state.*symbolic link|regular file/i],
  ["aggregate validated evidence", "validated-evidence.json", /validated evidence.*symbolic link|regular file/i],
  ["native bundle", "assets/beskid-1.2.3-x86_64-unknown-linux-gnu.tar.gz", /native aggregate asset.*symbolic link|regular file/i],
]) test(`verifier rejects a symlinked ${name}`, t => {
  const value = fixture(t), path = join(value.native, relative), actual = join(value.root, `actual-native-${name.replaceAll(" ", "-")}`);
  cpSync(path, actual); rmSync(path); symlinkSync(actual, path); expectRejectedBeforeOutput(value, pattern);
});

for (const [name, file, pattern] of [
  ["DEB", value => join(value.qualified, value.intent.artifact.name), /DEB.*symbolic link|regular file/i],
  ["RED evidence", value => join(value.qualified, value.intent.qualification.red.log), /RED.*symbolic link|regular file/i],
  ["GREEN evidence", value => join(value.qualified, value.intent.qualification.green.log), /GREEN.*symbolic link|regular file/i],
]) test(`verifier rejects a symlinked ${name}`, t => {
  const value = fixture(t), path = file(value), actual = join(value.root, `actual-qualified-${name.replaceAll(" ", "-")}`);
  cpSync(path, actual); rmSync(path); symlinkSync(actual, path); expectRejectedBeforeOutput(value, pattern);
});

test("verifier rejects a symlinked parent within the native aggregate", t => {
  const value = fixture(t), actual = join(value.root, "actual-assets");
  cpSync(join(value.native, "assets"), actual, { recursive: true }); rmSync(join(value.native, "assets"), { recursive: true });
  symlinkSync(actual, join(value.native, "assets")); expectRejectedBeforeOutput(value, /assets.*symbolic link|directory/i);
});

for (const input of ["intentPath", "native", "recipe", "qualified", "output"]) test(`verifier rejects a symlinked ancestor of ${input}`, t => {
  const value = fixture(t), alias = join(value.root, `linked-${input}`);
  if (input === "output") {
    const actual = join(value.root, "actual-output-parent");
    mkdirSync(actual); symlinkSync(value.root, alias);
    expectRejectedBeforeOutput(value, /ancestor.*symbolic link|parent.*symbolic link/i, join(alias, "actual-output-parent", "out"));
    return;
  }
  symlinkSync(value.root, alias);
  if (input === "intentPath") {
    const container = join(value.root, "intent-container");
    mkdirSync(container); cpSync(value.intentPath, join(container, "intent.json"));
    value.intentPath = join(alias, "intent-container", "intent.json");
  } else value[input] = join(alias, input);
  expectRejectedBeforeOutput(value, /ancestor.*symbolic link|parent.*symbolic link/i);
});

for (const [name, mutate, pattern] of [
  ["unknown top-level intent field", intent => { intent.unexpected = true; }, /exactly|unknown/i],
  ["unknown nested intent field", intent => { intent.qualification.green.unexpected = true; }, /GREEN.*exactly|unknown/i],
  ["missing nested intent field", intent => { delete intent.qualification.fixture.c_probe.sha256; }, /c_probe.*exactly|sha256/i],
  ["non-finite schema number", intent => { intent.schema_version = null; }, /schema|identity/i],
  ["entrypoint traversal", intent => { intent.recipe.entrypoint = "deb/../outside"; }, /entrypoint|relative path/i],
  ["qualification log traversal", intent => { intent.qualification.red.log = "../red.log"; }, /RED.*log|relative path/i],
  ["record traversal", intent => { intent.record.name = "../correction-v1.json"; }, /record name/i],
  ["target and architecture mismatch", intent => { intent.qualification.environment.architecture = "arm64"; }, /target.*architecture|architecture.*target/i],
  ["artifact version mismatch", intent => { intent.artifact.name = "beskid-9.9.9-amd64.deb"; }, /artifact name.*version|artifact.*name/i],
  ["bundle version mismatch", intent => { intent.native.bundle.name = "beskid-9.9.9-x86_64-unknown-linux-gnu.tar.gz"; }, /bundle name.*version|bundle.*name/i],
  ["record and artifact mismatch", intent => { intent.record.name = "other.correction-v1.json"; }, /record name.*artifact|record.*name/i],
  ["duplicate required check", intent => { intent.qualification.green.required_checks = [...CHECKS.slice(0, -1), "locked-run"]; }, /required checks/i],
]) test(`verifier rejects ${name}`, t => { const value = fixture(t); rewriteIntent(value, mutate); expectRejectedBeforeOutput(value, pattern); });

test("verifier rejects an unexpected qualified-input inventory", t => {
  const value = fixture(t); writeFileSync(join(value.qualified, "package-result.json"), "{}\n"); expectRejectedBeforeOutput(value, /qualified.*inventory/i);
});
test("verifier rejects a harness or fixture that differs from the finite intent", t => {
  const value = fixture(t); writeFileSync(join(value.recipe, value.intent.qualification.fixture.c_probe.path), "int main(void) { return 1; }\n"); expectRejectedBeforeOutput(value, /fixture|c_probe|clean/i);
});
test("verifier output files are not group- or world-readable", t => {
  const value = fixture(t), { result, output } = run(value); assert.equal(result.status, 0, result.stderr);
  for (const path of [join(output, value.intent.artifact.name), join(output, value.intent.record.name), join(output, "correction-intent.json"), join(output, "qualification/red.log"), join(output, "qualification/green.log")]) {
    assert.equal(lstatSync(path).mode & 0o077, 0, path);
  }
  chmodSync(output, 0o700);
});

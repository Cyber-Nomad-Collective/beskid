// Corelib publish set derivation and version policy of scripts/ci/lib/corelib-publish-runner.mjs.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { EXCLUDED_CORELIB_MEMBERS, corelibInventory, nextVersion, parseVersionPolicy } from "../lib/corelib-publish-runner.mjs";

function member(id, path, pkg, category = "Library") {
  return `member "${id}" {\n  path = "${path}"\n  package = "${pkg}"\n  description = "${id} package"\n  category = "${category}"\n  tags = ["corelib"]\n}\n`;
}
function project(root, path, name, { type = null, readme = "README.md", deps = [] } = {}) {
  const dir = join(root, path);
  mkdirSync(dir, { recursive: true });
  const fields = [`name = "${name}"`, `version = "0.1.0"`, type && `type = ${type}`, readme && `readme = "${readme}"`].filter(Boolean).join("\n  ");
  const dependencies = deps.map((dep) => `dependency "${dep}" { source = path path = "../${dep}" }\n`).join("");
  writeFileSync(join(dir, `${name}.bproj`), `${name} {\n  ${fields}\n}\n\n${dependencies}`);
  if (readme) writeFileSync(join(dir, readme), `# ${name}\n`);
}

// A small CoreLib workspace: libraries, a Mod used by a library, the aggregate and the excluded members.
function workspace(t, { extra = [], exclude = [], aggregateDeps = null, readmeless = [] } = {}) {
  const root = mkdtempSync(join(tmpdir(), "beskid-corelib-ws-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const libraries = [
    ["foundation", "packages/foundation", "corelib_foundation", []],
    ["serialization", "packages/serialization", "corelib_serialization", ["corelib_foundation", "serialization_mod"]],
    ...extra,
  ];
  let bws = 'workspace {\n  name = "corelib"\n  resolver = v1\n  defaultTestMember = "corelib_tests"\n}\n\n';
  bws += member("corelib", "beskid_corelib", "corelib");
  project(root, "beskid_corelib", "corelib", { type: "Aggregate", deps: aggregateDeps ?? libraries.map(([, , pkg]) => pkg) });
  for (const [id, path, pkg, deps] of libraries) {
    bws += member(id, path, pkg);
    project(root, path, pkg, { deps, readme: readmeless.includes(id) ? null : "README.md" });
  }
  bws += member("serialization_mod", "mods/serialization_mod", "serialization_mod");
  project(root, "mods/serialization_mod", "serialization_mod", { type: "Mod", readme: null });
  const excluded = [
    member("corelib_tests", "beskid_corelib/tests/corelib_tests", "corelib_tests", "Test"),
    member("corelib_pest_gen", "mods/corelib_pest_gen", "corelib_pest_gen"),
    member("pest_gen_schema", "packages/pest-gen-schema", "pest_gen_schema"),
  ];
  bws += excluded.filter((block) => !exclude.some((id) => block.startsWith(`member "${id}"`))).join("");
  writeFileSync(join(root, "CoreLib.bws"), bws);
  return root;
}
const names = (packages) => packages.map((meta) => meta.registryName);

test("the publish set is every workspace member minus the exclusions, dependencies first", (t) => {
  const packages = corelibInventory(workspace(t));
  assert.deepEqual(names(packages), ["corelib_foundation", "serialization_mod", "corelib_serialization", "corelib"]);
  assert.equal(packages.at(-1).memberId, "corelib", "the aggregate is uploaded after its dependencies");
});

test("excluded members are never published and each exclusion has a reason", (t) => {
  const published = names(corelibInventory(workspace(t)));
  assert.deepEqual([...EXCLUDED_CORELIB_MEMBERS.keys()].sort(), ["corelib_pest_gen", "corelib_tests", "pest_gen_schema"]);
  for (const [id, reason] of EXCLUDED_CORELIB_MEMBERS) {
    assert.ok(!published.includes(id), `${id} is excluded`);
    assert.ok(reason.trim(), `${id} records a reason`);
  }
});

test("an exclusion that names no workspace member fails", (t) => {
  assert.throws(() => corelibInventory(workspace(t, { exclude: ["pest_gen_schema"] })), /excluded corelib member pest_gen_schema is not a workspace member/);
});

test("a new workspace member that no list names is published automatically", (t) => {
  const root = workspace(t, { extra: [["quic9", "packages/quic9", "corelib_quic9", ["corelib_foundation"]]] });
  const packages = corelibInventory(root);
  assert.ok(names(packages).includes("corelib_quic9"));
  assert.ok(names(packages).indexOf("corelib_foundation") < names(packages).indexOf("corelib_quic9"));
});

test("the aggregate must name every published library; Mods are dependencies, not aggregate members", (t) => {
  const root = workspace(t, { extra: [["web9", "packages/web9", "corelib_web9", ["corelib_foundation"]]], aggregateDeps: ["corelib_foundation", "corelib_serialization"] });
  assert.throws(() => corelibInventory(root), /production corelib aggregate dependencies/);
  const meta = corelibInventory(workspace(t)).find((item) => item.registryName === "serialization_mod");
  assert.equal(meta.projectType, "Mod");
});

test("a dependency outside the publish set fails closed", (t) => {
  const root = workspace(t, { extra: [["web9", "packages/web9", "corelib_web9", ["corelib_unknown"]]] });
  assert.throws(() => corelibInventory(root), /dependency corelib_unknown is not in the production publication plan/);
});

test("a readme is optional, but a declared readme must exist", (t) => {
  assert.ok(names(corelibInventory(workspace(t, { readmeless: ["serialization"] }))).includes("corelib_serialization"));
  const root = workspace(t);
  rmSync(join(root, "packages/foundation/README.md"));
  assert.throws(() => corelibInventory(root), /declared readme README.md is missing/);
});

test("the version policy input accepts patch, minor, major and an exact version", () => {
  assert.equal(parseVersionPolicy(undefined), "patch", "patch is the default");
  assert.equal(parseVersionPolicy(""), "patch");
  for (const policy of ["patch", "minor", "major", "MINOR"]) assert.equal(parseVersionPolicy(policy), policy.toLowerCase());
  assert.equal(parseVersionPolicy("0.7.0"), "0.7.0");
  for (const invalid of ["latest", "1.2", "v1.2.3", "1.2.3-rc.1"]) assert.throws(() => parseVersionPolicy(invalid), /BESKID_PCKG_VERSION_BUMP must be/);
  assert.equal(nextVersion("0.3.4", "patch"), "0.3.5");
  assert.equal(nextVersion("0.3.4", "minor"), "0.4.0");
  assert.equal(nextVersion("0.3.4", "major"), "1.0.0");
  assert.equal(nextVersion(null, "patch"), "0.1.1");
  assert.equal(nextVersion("0.3.4", "0.6.0"), "0.6.0");
  assert.equal(nextVersion(null, "0.6.0"), "0.6.0", "a new package takes the exact version");
  assert.throws(() => nextVersion("0.6.0", "0.6.0"), /not greater than the latest registry version 0\.6\.0/);
  assert.throws(() => nextVersion("0.7.1", "0.6.0"), /not greater/);
});

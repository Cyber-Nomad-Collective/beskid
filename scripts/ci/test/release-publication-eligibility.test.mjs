import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = new URL("../release-publication-eligibility.mjs", import.meta.url).pathname;
const heldVersion = "0.5.1";
const heldCompiler = "1bd7bdee81d59ef14339e6a6c2ce18eb36585238";
const syntheticCompiler = "0123456789abcdef0123456789abcdef01234567";

function run(path, version, compiler) {
  return spawnSync(process.execPath, [path, "check-source", version, compiler], { encoding: "utf8" });
}

function copiedChecker(holds) {
  const directory = mkdtempSync(join(tmpdir(), "beskid-publication-holds-"));
  const copied = join(directory, "release-publication-eligibility.mjs");
  cpSync(script, copied);
  writeFileSync(join(directory, "release-publication-holds.json"), holds);
  return copied;
}

test("the known-bad 0.5.1 compiler source is held while another exact source passes", () => {
  assert.equal(existsSync(script), true, "release publication eligibility checker is missing");
  const held = run(script, heldVersion, heldCompiler);
  assert.notEqual(held.status, 0);
  assert.match(held.stderr, /publication hold.*0\.5\.1.*1bd7bdee/i);

  const allowed = run(script, heldVersion, syntheticCompiler);
  assert.equal(allowed.status, 0, allowed.stderr);
});

test("malformed public source arguments fail closed", () => {
  if (!existsSync(script)) return;
  for (const [version, compiler] of [
    ["v0.5.1", heldCompiler],
    ["0.5", heldCompiler],
    [heldVersion, heldCompiler.toUpperCase()],
    [heldVersion, "abc"],
  ]) {
    const result = run(script, version, compiler);
    assert.notEqual(result.status, 0, `${version} ${compiler} was accepted`);
  }
});

test("malformed and duplicate hold records fail closed", () => {
  if (!existsSync(script)) return;
  const valid = {
    version: heldVersion,
    compiler_commit: heldCompiler,
    reason: "released compiler loses Corelib intrinsic authority after relocation",
  };
  const invalidDocuments = [
    JSON.stringify({ schema_version: 2, holds: [valid] }),
    JSON.stringify({ schema_version: 1, holds: [{ ...valid, compiler_commit: "abc" }] }),
    JSON.stringify({ schema_version: 1, holds: [{ ...valid, unexpected: true }] }),
    JSON.stringify({ schema_version: 1, holds: [valid, valid] }),
  ];
  for (const document of invalidDocuments) {
    const checker = copiedChecker(document + "\n");
    const result = run(checker, "9.9.9", syntheticCompiler);
    assert.notEqual(result.status, 0, `invalid hold document was accepted: ${document}`);
  }
});

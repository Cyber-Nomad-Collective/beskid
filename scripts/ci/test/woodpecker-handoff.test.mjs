import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ReadUploadComplete, ValidateHandoff } from "../woodpecker-handoff.mjs";

const cli = new URL("../woodpecker-handoff.mjs", import.meta.url).pathname;
const IDENTITY = { role: "macos", source: "a".repeat(40), compiler: "b".repeat(40), version: "0.6.0", pipeline: "305" };
const sha256 = value => createHash("sha256").update(value).digest("hex");

function handoff(t, identity = IDENTITY, files = { "beskid-darwin-arm64": "cli\n", "package-result.json": "{}\n" }) {
  const dir = mkdtempSync(join(tmpdir(), "handoff-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  writeFileSync(join(dir, "UPLOAD_SHA256SUMS"), Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([name, content]) => `${sha256(content)}  ${name}\n`).join(""));
  writeFileSync(join(dir, "UPLOAD_COMPLETE"), Object.entries(identity).map(([key, value]) => `${key}=${value}\n`).join(""));
  return dir;
}

test("a complete handoff reports its platform, own pipeline number, source and checksum list", (t) => {
  const dir = handoff(t);
  const result = ValidateHandoff(dir, IDENTITY);
  assert.equal(result.role, "macos");
  assert.equal(result.pipeline, 305);
  assert.equal(result.source, IDENTITY.source);
  assert.match(result.upload_sha256sums_sha256, /^[0-9a-f]{64}$/);
  const run = spawnSync(process.execPath, [cli, "validate", dir, ...Object.values(IDENTITY)], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).pipeline, 305);
});

for (const [key, value] of [["pipeline", "306"], ["source", "c".repeat(40)], ["role", "linux"], ["compiler", "d".repeat(40)], ["version", "0.6.1"]]) {
  test(`a handoff is rejected when its ${key} differs`, (t) => {
    const dir = handoff(t);
    assert.throws(() => ValidateHandoff(dir, { ...IDENTITY, [key]: value }), /UPLOAD_COMPLETE identity mismatch/);
  });
}

test("a handoff is rejected on a checksum mismatch, an unlisted file, or a missing marker", (t) => {
  const tampered = handoff(t);
  writeFileSync(join(tampered, "package-result.json"), "{\"altered\":true}\n");
  assert.throws(() => ValidateHandoff(tampered, IDENTITY), /handoff checksum mismatch: package-result.json/);
  const extra = handoff(t);
  writeFileSync(join(extra, "extra.bin"), "x");
  assert.throws(() => ValidateHandoff(extra, IDENTITY), /checksum inventory mismatch/);
  const unfinished = handoff(t);
  rmSync(join(unfinished, "UPLOAD_COMPLETE"));
  assert.throws(() => ValidateHandoff(unfinished, IDENTITY), /handoff is incomplete/);
  const linked = handoff(t);
  symlinkSync(join(linked, "package-result.json"), join(linked, "link.json"));
  assert.throws(() => ValidateHandoff(linked, IDENTITY), /not a regular file/);
});

test("a completion marker must carry exactly the five identity fields", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "marker-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "UPLOAD_COMPLETE");
  writeFileSync(path, "role=windows\nsource=" + "a".repeat(40) + "\ncompiler=" + "b".repeat(40) + "\nversion=0.6.0\npipeline=299\n");
  assert.deepEqual(ReadUploadComplete(path), { role: "windows", source: "a".repeat(40), compiler: "b".repeat(40), version: "0.6.0", pipeline: "299" });
  for (const content of ["role=windows\n", "role=windows\nrole=linux\n", `role=windows\nsource=${"a".repeat(40)}\ncompiler=${"b".repeat(40)}\nversion=0.6.0\npipeline=0\n`]) {
    writeFileSync(path, content);
    assert.throws(() => ReadUploadComplete(path), /invalid UPLOAD_COMPLETE/);
  }
  mkdirSync(join(dir, "nested"));
  assert.throws(() => ReadUploadComplete(join(dir, "nested")), /not a regular file/);
});

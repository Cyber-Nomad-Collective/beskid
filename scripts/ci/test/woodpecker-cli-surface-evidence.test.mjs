import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { cliSurfaceFixture } from "./cli-surface-fixture.mjs";

const tool = fileURLToPath(new URL("../woodpecker-cli-surface-evidence.mjs", import.meta.url));
const sha = data => createHash("sha256").update(data).digest("hex");
const source = { superrepo_commit: "a".repeat(40), compiler_commit: "b".repeat(40) };
const kit = "c".repeat(64);
const corelib = "d".repeat(64);

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "beskid-cli-receipt-"));
  const binary = join(dir, "beskid-linux-amd64");
  writeFileSync(binary, "versioned CLI bytes");
  const evidence = cliSurfaceFixture(binary, sha(readFileSync(binary)), corelib);
  const evidencePath = join(dir, "cli-surface-evidence-v1.json");
  writeFileSync(evidencePath, `${JSON.stringify(evidence)}\n`);
  const receiptPath = join(dir, "cli-surface-receipt-v1.json");
  const args = ["create", evidencePath, binary, receiptPath, "0.5.1", source.superrepo_commit, source.compiler_commit, kit, corelib];
  return { dir, binary, evidence, evidencePath, receiptPath, args };
}

function run(args) { return spawnSync(process.execPath, [tool, ...args], { encoding: "utf8" }); }

test("receipt rejects a truncated advertised command inventory", () => {
  const item = fixture();
  try {
    item.evidence.rows = item.evidence.rows.filter(row => row.path !== "pckg whoami");
    item.evidence.counts.pass--;
    writeFileSync(item.evidencePath, `${JSON.stringify(item.evidence)}\n`);
    assert.notEqual(run(item.args).status, 0);
  }
  finally { rmSync(item.dir, { recursive: true, force: true }); }
});

test("receipt binds successful CLI and PTY evidence to the versioned binary and pinned release inputs", () => {
  const item = fixture();
  try {
    const result = run(item.args);
    assert.equal(result.status, 0, result.stderr);
    const receipt = JSON.parse(readFileSync(item.receiptPath, "utf8"));
    assert.deepEqual(receipt.source, source);
    assert.equal(receipt.binary_sha256, sha(readFileSync(item.binary)));
    assert.equal(receipt.evidence_sha256, sha(readFileSync(item.evidencePath)));
    assert.equal(receipt.runtime_kit_sha256, kit);
    assert.equal(receipt.corelib_fingerprint, corelib);
    assert.equal(run(["validate", item.dir, "0.5.1", source.superrepo_commit, source.compiler_commit, kit, corelib]).status, 0);
    assert.notEqual(run(["validate", item.dir, "0.5.1", "e".repeat(40), source.compiler_commit, kit, corelib]).status, 0);
    assert.notEqual(run(["validate", item.dir, "0.5.1", source.superrepo_commit, source.compiler_commit, "e".repeat(64), corelib]).status, 0);
    assert.notEqual(run(["validate", item.dir, "0.5.1", source.superrepo_commit, source.compiler_commit, kit, "e".repeat(64)]).status, 0);
  } finally { rmSync(item.dir, { recursive: true, force: true }); }
});

test("receipt rejects uncovered paths, failed PTY, and falsely claimed gate provenance", () => {
  for (const mutate of [
    e => { e.counts.uncovered = 1; e.counts.setup_skip--; e.rows.find(row => row.path === "dev lsp install").status = "uncovered"; },
    e => { e.rows.find(row => row.path === "dev project graph --tui").rendered_project = false; },
    e => { e.source_provenance.status = "verified"; },
  ]) {
    const item = fixture();
    try {
      mutate(item.evidence);
      writeFileSync(item.evidencePath, `${JSON.stringify(item.evidence)}\n`);
      assert.notEqual(run(item.args).status, 0);
    } finally { rmSync(item.dir, { recursive: true, force: true }); }
  }
});

test("qualification rejects changed evidence or binary after receipt creation", () => {
  const item = fixture();
  try {
    assert.equal(run(item.args).status, 0);
    writeFileSync(item.evidencePath, `${JSON.stringify(item.evidence)} \n`);
    assert.notEqual(run(["validate", item.dir, "0.5.1", source.superrepo_commit, source.compiler_commit, kit, corelib]).status, 0);
    writeFileSync(item.evidencePath, `${JSON.stringify(item.evidence)}\n`);
    writeFileSync(item.binary, "tampered CLI");
    assert.notEqual(run(["validate", item.dir, "0.5.1", source.superrepo_commit, source.compiler_commit, kit, corelib]).status, 0);
  } finally { rmSync(item.dir, { recursive: true, force: true }); }
});

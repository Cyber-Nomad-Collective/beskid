#!/usr/bin/env node
// Bind the compiler's CLI/PTY run to the trusted native build identity.
// The compiler gate deliberately does not claim to establish source provenance.
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const SHA = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const EVIDENCE = "cli-surface-evidence-v1.json";
const RECEIPT = "cli-surface-receipt-v1.json";
const BINARY = "beskid-linux-amd64";
function fail(message) { throw new Error(message); }
function file(path) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) fail(`${path} must be a regular file`);
  return readFileSync(path);
}
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function json(path) {
  let value;
  try { value = JSON.parse(file(path).toString("utf8")); }
  catch (error) { fail(`${path} is invalid JSON: ${error.message}`); }
  if (!value || Array.isArray(value) || typeof value !== "object") fail(`${path} must be a JSON object`);
  return value;
}
function equal(actual, expected, label) { if (actual !== expected) fail(`${label} mismatch`); }
function digest(value, label) { if (!SHA.test(value)) fail(`${label} must be SHA-256`); return value; }
function commit(value, label) { if (!COMMIT.test(value)) fail(`${label} must be a Git commit`); return value; }
function validateGate(evidence, binarySha, corelibFingerprint) {
  equal(evidence.schema, "beskid.cli-surface.v1", "CLI gate schema");
  equal(evidence.binary_sha256, binarySha, "CLI gate binary digest");
  equal(basename(evidence.binary || ""), BINARY, "CLI gate binary name");
  equal(evidence.corelib_fingerprint, corelibFingerprint, "CLI gate Corelib fingerprint");
  if (evidence.release_qualified !== false || evidence.source_provenance?.status !== "unverified" ||
      evidence.source_provenance?.commit !== null || evidence.source_provenance?.external_receipt_required !== true) {
    fail("CLI gate must leave source provenance and release qualification unverified");
  }
  if (!Array.isArray(evidence.rows) || evidence.rows.length === 0) fail("CLI gate rows are missing");
  const counts = { pass: 0, fail: 0, setup_skip: 0, uncovered: 0, inventory_only: 0 };
  const byPath = new Map();
  for (const row of evidence.rows) {
    if (!row || typeof row.path !== "string" || byPath.has(row.path) || !Object.hasOwn(counts, row.status)) fail("invalid or duplicate CLI gate row");
    byPath.set(row.path, row);
    counts[row.status]++;
    if (row.status === "pass" && (row.exit !== 0 || row.expected_exit !== 0 ||
        (row.control_bytes && row.control_bytes.length !== 0))) fail(`${row.path} did not pass cleanly`);
    if (row.status === "setup_skip" && !row.reason) fail(`${row.path} has no setup-skip reason`);
    if (row.status === "inventory_only" && row.kind !== "branch") fail(`${row.path} is not a branch inventory row`);
  }
  for (const [name, count] of Object.entries(counts)) equal(evidence.counts?.[name], count, `CLI gate ${name} count`);
  if (counts.fail !== 0 || counts.uncovered !== 0 || counts.pass === 0) fail("CLI gate has failed, uncovered, or no exercised paths");
  const graph = byPath.get("graph --tui");
  const analyze = byPath.get("analyze --plain PTY");
  if (graph?.status !== "pass" || graph.timed_out !== false || graph.rendered_project !== true || !graph.transcript_base64 ||
      analyze?.status !== "pass" || analyze.timed_out !== false || analyze.line_output !== true || analyze.summary_seen !== true || !analyze.transcript_base64) {
    fail("required CLI PTY evidence is missing or failed");
  }
  const { hi_unknown: hi, new_tui_rejected: picker, graph_tui_advertised: graphAdvertised } = evidence.contracts || {};
  if (hi?.exit !== 2 || hi.unknown_subcommand !== true || hi.control_bytes?.length !== 0 ||
      picker?.exit !== 2 || picker.not_advertised !== true || picker.unexpected_argument !== true || picker.control_bytes?.length !== 0 ||
      graphAdvertised !== true) fail("CLI command contracts failed");
  return counts;
}
function validate(dir, version, source, kit, corelib) {
  const receipt = json(join(dir, RECEIPT));
  const binarySha = sha(file(join(dir, BINARY)));
  const evidenceSha = sha(file(join(dir, EVIDENCE)));
  equal(receipt.schema_version, 1, "CLI receipt schema");
  equal(receipt.status, "success", "CLI receipt status");
  equal(receipt.version, version, "CLI receipt version");
  equal(receipt.binary, BINARY, "CLI receipt binary");
  equal(receipt.binary_sha256, binarySha, "CLI receipt binary digest");
  equal(receipt.evidence, EVIDENCE, "CLI receipt evidence name");
  equal(receipt.evidence_sha256, evidenceSha, "CLI receipt evidence digest");
  equal(receipt.source?.superrepo_commit, source.superrepo_commit, "CLI receipt superrepo commit");
  equal(receipt.source?.compiler_commit, source.compiler_commit, "CLI receipt compiler commit");
  equal(receipt.runtime_kit_sha256, kit, "CLI receipt runtime kit");
  equal(receipt.corelib_fingerprint, corelib, "CLI receipt Corelib fingerprint");
  validateGate(json(join(dir, EVIDENCE)), binarySha, corelib);
  return receipt;
}

try {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "create" && args.length === 8) {
    const [evidencePath, binaryPath, receiptPath, version, superrepo, compiler, kitArg, corelibArg] = args;
    if (basename(evidencePath) !== EVIDENCE || basename(binaryPath) !== BINARY || basename(receiptPath) !== RECEIPT ||
        resolve(evidencePath) !== join(resolve(receiptPath, ".."), EVIDENCE) ||
        resolve(binaryPath) !== join(resolve(receiptPath, ".."), BINARY)) fail("CLI receipt inputs must share the release output directory");
    const source = { superrepo_commit: commit(superrepo, "superrepo"), compiler_commit: commit(compiler, "compiler") };
    const kit = digest(kitArg, "runtime kit");
    const corelib = digest(corelibArg, "Corelib fingerprint");
    const binarySha = sha(file(binaryPath));
    const evidenceBytes = file(evidencePath);
    const counts = validateGate(json(evidencePath), binarySha, corelib);
    const receipt = { schema_version: 1, status: "success", version, source,
      binary: BINARY, binary_sha256: binarySha, evidence: EVIDENCE, evidence_sha256: sha(evidenceBytes),
      runtime_kit_sha256: kit, corelib_fingerprint: corelib, counts };
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  } else if (mode === "validate" && args.length === 6) {
    const [directory, version, superrepo, compiler, kitArg, corelibArg] = args;
    validate(resolve(directory), version,
      { superrepo_commit: commit(superrepo, "superrepo"), compiler_commit: commit(compiler, "compiler") },
      digest(kitArg, "runtime kit"), digest(corelibArg, "Corelib fingerprint"));
  } else {
    fail("usage: woodpecker-cli-surface-evidence.mjs <create evidence binary receipt version superrepo compiler kit corelib|validate directory version superrepo compiler kit corelib>");
  }
} catch (error) {
  process.stderr.write(`CLI surface evidence: ${error.message}\n`);
  process.exit(1);
}

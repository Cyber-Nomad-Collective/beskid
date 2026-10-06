import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test, { after } from "node:test";
import * as reader from "../woodpecker-release-evidence.mjs";

const planned = JSON.parse(readFileSync(new URL("../release-cases-v06.json", import.meta.url)));
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const bytesDigest = value => createHash("sha256").update(value).digest("hex");
const fixtureRoots = [];
after(() => fixtureRoots.forEach(root => rmSync(root, { recursive: true, force: true })));
// These fixtures exercise the reader schema only. Their names are explicitly
// synthetic and must never be installed as release assertion bindings.
function fixture(target = planned.targets[0]) {
  const manifest = structuredClone(planned);
  manifest.state = "frozen";
  for (const item of manifest.cases) item.binding = {
    project: "reader-fixture", target: "reader-fixture", harness_language: "node",
    required_test_ids: [`reader-fixture/${item.id}`],
    harness_source: { path: "reader-fixture.mjs", sha256: "b".repeat(64) },
  };
  const profileBinding = manifest.cases.find(item => item.id === "R4-ABI-01").binding;
  profileBinding.profile_assertions = [];
  for (const representation of manifest.rust_profile.representations)
    for (const implementation of manifest.rust_profile.implementations)
      for (const direction of manifest.rust_profile.directions)
        profileBinding.profile_assertions.push({ representation, implementation, direction,
          test_id: `reader-fixture/R4-ABI-01/${representation}/${implementation}/${direction}` });
  profileBinding.required_test_ids = profileBinding.profile_assertions.map(item => item.test_id);
  const obligationMatrix = [];
  for (const [kind, obligations] of Object.entries(manifest.required_obligations)) {
    const caseId = kind === "process" ? "R4-PROC-01" : kind === "stdio" ? "R4-IO-01" : "R4-ABI-02";
    const binding = manifest.cases.find(item => item.id === caseId).binding;
    binding.obligation_assertions ??= [];
    for (const obligation of obligations) {
      const test_id = `reader-fixture/${caseId}/${kind}/${obligation}`;
      binding.required_test_ids.push(test_id);
      binding.obligation_assertions.push({ kind, obligation, test_id });
      obligationMatrix.push({ kind, obligation, case_id: caseId, test_id });
    }
  }
  const source = { root: "1".repeat(40), compiler: "2".repeat(40), corelib: "3".repeat(40) };
  const feature = {
    schema_version: 2, version: "0.6.0", target, source,
    case_manifest_sha256: digest(manifest),
    runtime_kit: { sha256: "c".repeat(64), abi_sha256: "d".repeat(64) },
    installed_prefix: { path: "/reader-fixture/candidate", manifest_sha256: "e".repeat(64), fallback_used: false },
    cases: manifest.cases.map(item => ({
      id: item.id, requirement_ids: item.requirement_ids, status: "success",
      target, source, runtime_kit_sha256: "c".repeat(64), artifact_sha256: "f".repeat(64),
      harness_source: item.binding.harness_source,
      command: { argv: ["/reader-fixture/candidate/bin/beskid", "test"], tool_sha256: "a".repeat(64) },
      input_sha256: "9".repeat(64), stdout_sha256: "8".repeat(64), stderr_sha256: "7".repeat(64),
      exit_code: 0, timed_out: false, tests: item.binding.required_test_ids.map(id => ({ id, outcome: "passed" })),
    })),
    rust_profile_matrix: [], obligation_matrix: obligationMatrix, not_applicable: { dotnet_glue: "stretch" },
  };
  for (const representation of manifest.rust_profile.representations)
    for (const implementation of manifest.rust_profile.implementations)
      for (const direction of manifest.rust_profile.directions)
        feature.rust_profile_matrix.push({ representation, implementation, direction,
          case_id: "R4-ABI-01", test_id: `reader-fixture/R4-ABI-01/${representation}/${implementation}/${direction}` });
  const packet_root = mkdtempSync(join(tmpdir(), "beskid-v06-reader-fixture-"));
  fixtureRoots.push(packet_root);
  const packet_files = {};
  const retain = (name, bytes) => { writeFileSync(join(packet_root, name), bytes); packet_files[name] = bytesDigest(bytes); return { path: name, sha256: packet_files[name] }; };
  const harnessText = manifest.cases.flatMap(item => item.binding.required_test_ids).map(id => `test(${JSON.stringify(id)}, () => {});`).join("\n");
  const harness = retain("reader-fixture.mjs", harnessText);
  const artifact = retain("candidate-cli", "synthetic candidate executable bytes\n");
  const bundle = retain("candidate-bundle.tar.gz", "synthetic complete bundle bytes\n");
  const runtime = retain("runtime-kit.json", JSON.stringify({ target, source, version: "0.6.0" }));
  const abi = retain("runtime-abi.json", "synthetic ABI manifest bytes\n");
  const executedArtifact = retain("foreign-fixture", "synthetic distinct executed foreign binary\n");
  feature.runtime_kit = { sha256: runtime.sha256, abi_sha256: abi.sha256, receipt: runtime.path, abi_receipt: abi.path };
  const input = retain("corpus.json", "synthetic input corpus\n");
  const stdout = retain("stdout.log", "synthetic bounded stdout\n");
  const stderr = retain("stderr.log", "");
  const command = { argv: [join(packet_root, artifact.path), "test"], tool_sha256: artifact.sha256, tool_file: artifact.path, version: "reader-fixture-1" };
  feature.installed_prefix.path = packet_root;
  const installed = retain("installed-prefix.json", JSON.stringify({ prefix: packet_root, target, source, version: "0.6.0",
    runtime_kit_sha256: runtime.sha256, abi_sha256: abi.sha256, bundle_sha256: bundle.sha256, cli: artifact,
    files: [artifact, bundle, runtime, abi] }));
  feature.installed_prefix.receipt = installed.path;
  feature.installed_prefix.manifest_sha256 = installed.sha256;
  for (const item of manifest.cases) {
    const assertion_provenance = item.binding.required_test_ids.map(test_id => {
      const declaration = `test(${JSON.stringify(test_id)},`;
      const start = Buffer.byteLength(harnessText.slice(0, harnessText.indexOf(declaration)));
      return { test_id, source: harness, start, end: start + Buffer.byteLength(declaration), declaration };
    });
    Object.assign(item.binding, { harness_source: harness, command, input, stdout, stderr, artifact: executedArtifact,
      assertion_provenance, reviewed_source_binding: true, log: `case-${item.id}.json` });
    const row = feature.cases.find(row => row.id === item.id);
    Object.assign(row, { harness_source: harness, command, artifact_sha256: executedArtifact.sha256,
      candidate_cli_sha256: artifact.sha256, candidate_bundle_sha256: bundle.sha256, runtime_kit_sha256: runtime.sha256, input_sha256: input.sha256,
      stdout_sha256: stdout.sha256, stderr_sha256: stderr.sha256, log: item.binding.log });
    const retained = retain(row.log, JSON.stringify(row)); row.log_sha256 = retained.sha256;
  }
  feature.case_manifest_sha256 = digest(manifest);
  retain("release-cases-v06.json", JSON.stringify(manifest));
  return { feature, manifest, expected: { source, target, version: "0.6.0", case_manifest_sha256: digest(manifest),
    packet_root, packet_files, runtime_kit_sha256: runtime.sha256, runtime_abi_sha256: abi.sha256,
    candidate_cli_sha256: artifact.sha256, candidate_bundle_sha256: bundle.sha256,
    installed_cli: join(packet_root, artifact.path) } };
}
function validate(value) {
  assert.equal(typeof reader.ValidateV06FeatureEvidence, "function", "versioned reader API is required");
  return reader.ValidateV06FeatureEvidence(value.feature, value.manifest, value.expected);
}
function reject(value, pattern) {
  assert.equal(typeof reader.ValidateV06FeatureEvidence, "function", "versioned reader API is required");
  assert.throws(() => reader.ValidateV06FeatureEvidence(value.feature, value.manifest, value.expected), pattern);
}

test("the draft manifest retains all mandatory IDs without inventing execution bindings", () => {
  assert.equal(planned.cases.length, 101);
  assert.equal(planned.cases.filter(item => item.spec_change === null).length, 16);
  assert.equal(new Set(planned.cases.map(item => item.id)).size, 101);
  assert(planned.cases.every(item => item.binding === null || item.binding.required_test_ids === null));
});
test("complete reader-only matrix has a success path on every required native target", () => {
  for (const target of planned.targets) assert.doesNotThrow(() => validate(fixture(target)));
});
test("every mandatory case is required independently including retained baselines", () => {
  for (const item of planned.cases) {
    const value = fixture(); value.feature.cases = value.feature.cases.filter(row => row.id !== item.id);
    reject(value, new RegExp(item.id));
  }
});
test("scalar-only Glue cannot satisfy the full manual/generated import/export profile", () => {
  const value = fixture(); value.feature.rust_profile_matrix = value.feature.rust_profile_matrix.filter(row => row.representation === "i64");
  reject(value, /profile|matrix|representation/i);
});
test("complete dimension labels cannot borrow an unrelated passing scalar assertion", () => {
  const value = fixture();
  value.feature.rust_profile_matrix[0].case_id = "foundations.time";
  value.feature.rust_profile_matrix[0].test_id = "reader-fixture/foundations.time";
  reject(value, /profile|assertion|bind/i);
});
for (const outcome of ["failed", "skipped", "filtered_out", "timed_out", "blocked", "not_executed"])
  test(`mandatory assertion rejects ${outcome}`, () => {
    const value = fixture(); value.feature.cases[16].tests[0].outcome = outcome;
    reject(value, /assertion|outcome|execut/i);
  });
for (const field of ["source", "target", "runtime_kit_sha256", "artifact_sha256", "harness_source"])
  test(`consumed ${field} mismatch rejects stale evidence`, () => {
    const value = fixture(); value.feature.cases[16][field] = field === "source" ? { root: "4".repeat(40) } : "mismatch";
    reject(value, /source|target|runtime|artifact|harness/i);
  });
test("unbound obligations and the v0.5 Glue exemption cannot qualify 0.6", () => {
  const value = fixture(); value.manifest.cases[16].binding = null;
  reject(value, /bind|manifest/i);
  const exempt = fixture(); exempt.feature.not_applicable.rust_glue = "v0.5 deferred";
  reject(exempt, /Glue|mandatory|exempt/i);
});
test("duplicates, missing assertion, nonzero exit and installed fallback reject", () => {
  for (const mutate of [
    value => value.feature.cases.push(value.feature.cases[0]),
    value => value.feature.cases[16].tests = [],
    value => value.feature.cases[16].exit_code = 1,
    value => value.feature.installed_prefix.fallback_used = true,
  ]) { const value = fixture(); mutate(value); reject(value); }
});
test("a self-consistent replacement manifest cannot replace independently frozen authority", () => {
  const value = fixture(); value.manifest.cases.pop();
  value.feature.cases.pop(); value.feature.case_manifest_sha256 = digest(value.manifest);
  reject(value, /manifest|frozen/i);
});
test("every ownership failure process and stdio obligation needs its own bound executed assertion", () => {
  for (const [kind, obligations] of Object.entries(planned.required_obligations)) for (const obligation of obligations) {
    const value = fixture(); value.feature.obligation_matrix = value.feature.obligation_matrix.filter(row => !(row.kind === kind && row.obligation === obligation));
    reject(value, /obligation|ownership|process|stdio|failure/i);
  }
  const value = fixture(); value.feature.obligation_matrix[0].case_id = "foundations.time";
  value.feature.obligation_matrix[0].test_id = "reader-fixture/foundations.time";
  reject(value, /obligation|assertion|binding/i);
});
for (const field of ["command", "input_sha256", "stdout_sha256", "stderr_sha256", "log_sha256"])
  test(`forged ${field} evidence rejects`, () => {
    const value = fixture(); value.feature.cases[16][field] = field === "command" ? { argv: ["forged-tool"], tool_sha256: "0".repeat(64) } : "0".repeat(64);
    reject(value, /command|tool|input|stdout|stderr|log|digest/i);
  });
test("retained packet closure rejects missing tampered extra and symlinked files", () => {
  for (const mutate of [
    value => rmSync(join(value.expected.packet_root, "corpus.json")),
    value => writeFileSync(join(value.expected.packet_root, "stdout.log"), "tampered"),
    value => writeFileSync(join(value.expected.packet_root, "undeclared.log"), "extra"),
    value => { rmSync(join(value.expected.packet_root, "stdout.log")); symlinkSync("stderr.log", join(value.expected.packet_root, "stdout.log")); },
  ]) { const value = fixture(); mutate(value); reject(value, /packet|file|digest|symlink|regular/i); }
});
test("runtime ABI and installed candidate command ownership are independently pinned", () => {
  const wrongAbi = fixture(); wrongAbi.feature.runtime_kit.abi_sha256 = "0".repeat(64); reject(wrongAbi, /ABI|abi|runtime/i);
  const wrongCommand = fixture(); wrongCommand.feature.cases[16].command = { ...wrongCommand.feature.cases[16].command, argv: ["/developer/bin/beskid", "test"] };
  reject(wrongCommand, /command|installed|tool/i);
  for (const field of ["version", "runtime_kit_sha256", "abi_sha256", "bundle_sha256", "cli"] ) {
    const value = fixture(); const path = join(value.expected.packet_root, "installed-prefix.json");
    const receipt = JSON.parse(readFileSync(path)); receipt[field] = "forged";
    writeFileSync(path, JSON.stringify(receipt)); value.expected.packet_files["installed-prefix.json"] = bytesDigest(readFileSync(path));
    value.feature.installed_prefix.manifest_sha256 = value.expected.packet_files["installed-prefix.json"];
    reject(value, /installed|receipt|bundle|runtime|ABI|abi|version|cli/i);
  }
});
test("a source hash without reviewed actual test declarations cannot bind assertions", () => {
  const value = fixture(); value.manifest.cases[16].binding.assertion_provenance[0].declaration = 'test("invented-test",';
  value.expected.case_manifest_sha256 = digest(value.manifest); value.feature.case_manifest_sha256 = digest(value.manifest);
  writeFileSync(join(value.expected.packet_root, "release-cases-v06.json"), JSON.stringify(value.manifest));
  value.expected.packet_files["release-cases-v06.json"] = digest(value.manifest);
  reject(value, /assertion|declaration|source.*binding|provenance/i);
});

function nativeDeclarationFixture(transform = bytes => bytes) {
  // Real source declaration, synthetic execution receipt: reader coverage only.
  const value = fixture();
  const source = transform(readFileSync(new URL("../../../compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd", import.meta.url)));
  const test_id = "bsol_serialization_wire_exact_unsigned_width";
  const declaration = `test ${test_id}`;
  const start = source.indexOf(Buffer.from(declaration));
  assert(start >= 0);
  const harness = { path: "native-tests.bd", sha256: bytesDigest(source) };
  writeFileSync(join(value.expected.packet_root, harness.path), source);
  value.expected.packet_files[harness.path] = harness.sha256;
  const binding = value.manifest.cases[16].binding;
  Object.assign(binding, { harness_language: "beskid", harness_source: harness,
    required_test_ids: [test_id], assertion_provenance: [{ test_id, source: harness, start,
      end: start + Buffer.byteLength(declaration), declaration }] });
  const row = value.feature.cases[16];
  row.harness_source = harness;
  row.tests = [{ id: test_id, outcome: "passed" }];
  const retained = { ...row }; delete retained.log_sha256;
  const bytes = JSON.stringify(retained);
  writeFileSync(join(value.expected.packet_root, row.log), bytes);
  row.log_sha256 = value.expected.packet_files[row.log] = bytesDigest(bytes);
  value.expected.case_manifest_sha256 = value.feature.case_manifest_sha256 = digest(value.manifest);
  writeFileSync(join(value.expected.packet_root, "release-cases-v06.json"), JSON.stringify(value.manifest));
  value.expected.packet_files["release-cases-v06.json"] = digest(value.manifest);
  return value;
}

test("native Beskid test declarations can bind real source without a Node wrapper", () => {
  assert.doesNotThrow(() => validate(nativeDeclarationFixture()));
});
test("assertion declaration language is mandatory and cannot be relabeled", () => {
  for (const language of [undefined, "unknown", "node"]) {
    const value = nativeDeclarationFixture();
    value.manifest.cases[16].binding.harness_language = language;
    value.expected.case_manifest_sha256 = value.feature.case_manifest_sha256 = digest(value.manifest);
    writeFileSync(join(value.expected.packet_root, "release-cases-v06.json"), JSON.stringify(value.manifest));
    value.expected.packet_files["release-cases-v06.json"] = digest(value.manifest);
    reject(value, /language|declaration/i);
  }
});

test("native declaration cannot bind a prefix of another test identifier", () => {
  const value = nativeDeclarationFixture(bytes => Buffer.from(bytes.toString().replace(
    "test bsol_serialization_wire_exact_unsigned_width", "test bsol_serialization_wire_exact_unsigned_width_extra")));
  reject(value, /declaration.*body/i);
});

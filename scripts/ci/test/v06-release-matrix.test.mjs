import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test, { after } from "node:test";
import * as reader from "../woodpecker-release-evidence.mjs";
import {
  CanonicalManifestBytes, ManifestDigest, caseLogName, caseStderrName, caseStdoutName, findRustDeclaration, fixturePacketName,
  harnessPacketName, inputPacketName, libtestPath, sourcePacketName, CORELIB_FINGERPRINT_FILE, INSTALLED_RECEIPT, MANIFEST_FILE,
  RUNTIME_ABI_RECEIPT, RUNTIME_KIT_RECEIPT,
} from "../release-case-common.mjs";

const repo = new URL("../../../", import.meta.url);
const planned = JSON.parse(readFileSync(new URL("../release-cases-v06.json", import.meta.url)));
const bytesDigest = value => createHash("sha256").update(value).digest("hex");
const fixtureRoots = [];
after(() => fixtureRoots.forEach(root => rmSync(root, { recursive: true, force: true })));
const PROVISIONAL_IDS = planned.provisional_cases.map(item => item.id);
const PREFIX = "/reader-fixture/candidate";
const SOURCE = { superrepo_commit: "1".repeat(40), compiler_commit: "2".repeat(40) };
const identifier = id => `reader_fixture_${id.replace(/[^A-Za-z0-9_]/g, "_")}`;
const HOST_HARNESS = { "R4-ABI": "beskid_tests_interop", "R4-BIND": "beskid_tests_interop", "R4-CALL": "beskid_tests_interop",
  "R4-GEN": "beskid_tests_interop", "R4-TOOL": "beskid_tests_interop", "GLUE066-01": "beskid_tests_interop" };
function plannedExecution(id) {
  const prefix = id.split("-").slice(0, 2).join("-");
  if (HOST_HARNESS[prefix]) return { execution: "installed_host_harness", harness: HOST_HARNESS[prefix] };
  if (/^(CLI06|DEP06|MOD-06)-|^SER-04$|^BSOL-06-01$|^(PAR066|PORT066|PSEQ066)-02$|^(MOVE066|GCS066)-/.test(id)) return { execution: "installed_host_harness", harness: "beskid_tests_release" };
  return { execution: "installed_native", harness: null };
}
function libtestSection(id, { outcome = "ok", running = 1, exit = 0, qualified = id } = {}) {
  const body = running === 0 ? "\nrunning 0 tests\n\ntest result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.00s\n"
    : `\nrunning 1 test\ntest ${qualified} ... ${outcome}\n\ntest result: ${outcome === "ok" ? "ok. 1 passed; 0 failed" : "FAILED. 0 passed; 1 failed"}; 0 ignored; 0 measured; 3 filtered out; finished in 0.01s\n`;
  return `beskid-release-case begin test=${id}\n${body}beskid-release-case end test=${id} exit=${exit} timed_out=false\n`;
}
function invocationSection(id, digest, argv0 = "beskid", lines = 1) {
  return `beskid-release-case begin test=${id}\n${Array.from({ length: lines }, () => `beskid-installed-invocation sha256=${digest} argv0=${argv0}\n`).join("")}beskid-release-case end test=${id} exit=0 timed_out=false\n`;
}
// These fixtures exercise the reader schema only. Their names are explicitly
// synthetic and must never be installed as release assertion bindings.
function fixture(target = planned.targets[0], options = {}) {
  const manifest = structuredClone(planned);
  manifest.state = "frozen";
  const packet_root = mkdtempSync(join(tmpdir(), "beskid-v06-reader-fixture-"));
  fixtureRoots.push(packet_root);
  const packet_files = {};
  const retain = (name, bytes) => { writeFileSync(join(packet_root, name), bytes); packet_files[name] = bytesDigest(bytes); return { path: name, sha256: packet_files[name] }; };
  const cli = retain(target.includes("windows") ? "beskid-windows-amd64.exe" : "candidate-cli", "synthetic candidate executable bytes\n");
  const bundle = retain("candidate-bundle.tar.gz", "synthetic complete bundle bytes\n");
  const runtime = retain(RUNTIME_KIT_RECEIPT, JSON.stringify({ target, source: SOURCE, version: "0.6.0" }));
  const abi = retain(RUNTIME_ABI_RECEIPT, "synthetic ABI manifest bytes\n");
  const fingerprint = "5".repeat(64);
  const fingerprintFile = retain(CORELIB_FINGERPRINT_FILE, `${fingerprint}\n`);
  const corpus = retain(inputPacketName("bsol-corpus"), "synthetic corpus archive\n");
  const harnesses = {};
  for (const name of Object.keys(manifest.harness_executables)) harnesses[name] = retain(harnessPacketName(name, target), `synthetic ${name} harness executable\n`);
  const fixtures = {};
  for (const name of Object.keys(manifest.fixture_executables)) fixtures[name] = retain(fixturePacketName(name, target), `synthetic ${name} fixture executable\n`);
  manifest.target_packet_files = Object.fromEntries(manifest.targets.map(item => [item,
    [...Object.keys(manifest.harness_executables).map(name => harnessPacketName(name, item)), ...Object.keys(manifest.fixture_executables).map(name => fixturePacketName(name, item))]]));
  const installedCliName = target.includes("windows") ? "beskid.exe" : "beskid";
  const installed_cli = `${PREFIX}/bin/${installedCliName}`;
  const feature = {
    schema_version: 2, version: "0.6.0", target, source: SOURCE, case_manifest_sha256: null,
    runtime_kit: { sha256: runtime.sha256, abi_sha256: abi.sha256, receipt: runtime.path, abi_receipt: abi.path },
    installed_prefix: { path: PREFIX, receipt: INSTALLED_RECEIPT, manifest_sha256: null, fallback_used: false },
    cases: [], rust_profile_matrix: [], obligation_matrix: [], not_applicable: { dotnet_glue: "stretch" },
  };
  const installed = retain(INSTALLED_RECEIPT, JSON.stringify({ prefix: PREFIX, target, source: SOURCE, version: "0.6.0",
    runtime_kit_sha256: runtime.sha256, abi_sha256: abi.sha256, bundle_sha256: bundle.sha256, corelib_fingerprint: fingerprint,
    cli: { relative_path: `bin/${installedCliName}`, packet_copy: cli.path, sha256: cli.sha256 },
    files: [cli, bundle, runtime, abi, fingerprintFile] }));
  feature.installed_prefix.manifest_sha256 = installed.sha256;
  const packetFiles = new Set([INSTALLED_RECEIPT, RUNTIME_KIT_RECEIPT, RUNTIME_ABI_RECEIPT, CORELIB_FINGERPRINT_FILE, corpus.path]);
  const profileCase = "R4-ABI-01";
  const obligationCases = { ownership: "R4-ABI-10", failure: "R4-ABI-05", process: "R4-PROC-01" };
  for (const item of manifest.cases) {
    const { execution, harness } = plannedExecution(item.id);
    assert.equal(item.execution, execution, `${item.id} manifest execution kind`);
    const ids = [`${identifier(item.id)}_1`, `${identifier(item.id)}_2`];
    const profile_assertions = [], obligation_assertions = [];
    if (item.id === profileCase) {
      for (const representation of manifest.rust_profile.representations) for (const implementation of manifest.rust_profile.implementations)
        for (const direction of manifest.rust_profile.directions) {
          const test_id = `${identifier(item.id)}_${representation}_${implementation}_${direction}`;
          ids.push(test_id);
          profile_assertions.push({ representation, implementation, direction, test_id });
          feature.rust_profile_matrix.push({ representation, implementation, direction, case_id: item.id, test_id });
        }
    }
    for (const [kind, caseId] of Object.entries(obligationCases)) if (caseId === item.id) {
      for (const obligation of manifest.required_obligations[kind]) {
        const test_id = `${identifier(item.id)}_${kind}_${obligation}`;
        ids.push(test_id);
        obligation_assertions.push({ kind, obligation, test_id });
        feature.obligation_matrix.push({ kind, obligation, case_id: item.id, test_id });
      }
    }
    const language = execution === "installed_native" ? "beskid" : "rust";
    const source_file = language === "beskid" ? `reader-fixture/beskid-${item.id}.bd`
      : harness === "beskid_tests_interop" ? `compiler/crates/beskid_tests_interop/src/interop/reader_fixture_${identifier(item.id)}.rs`
      : `compiler/crates/beskid_tests_release/tests/reader_fixture_${identifier(item.id)}.rs`;
    const qualified = id => language === "beskid" ? id : libtestPath(source_file, manifest.harness_executables[harness].source_root, id);
    const extra = `${identifier(item.id)}_unrequired_passing`;
    const sourceText = language === "beskid" ? [...ids, extra].map(id => `test ${id} {\n}\n`).join("\n")
      : `mod tests {\n${ids.map(id => `    #[test]\n    fn ${id}() {}\n`).join("\n")}}\n`;
    const harness_source = retain(sourcePacketName(source_file), sourceText);
    packetFiles.add(harness_source.path);
    const assertion_provenance = ids.map(test_id => {
      const declaration = language === "beskid" ? `test ${test_id}` : `fn ${test_id}(`;
      const needle = language === "beskid" ? declaration : `#[test]\n    ${declaration}`;
      const start = Buffer.byteLength(sourceText.slice(0, sourceText.indexOf(needle))) + (language === "beskid" ? 0 : Buffer.byteLength("#[test]\n    "));
      return { test_id, source: harness_source, start, end: start + Buffer.byteLength(declaration), declaration };
    });
    const input = item.id === "BSOL-06-01" ? { id: "bsol-corpus", path: corpus.path, sha256: corpus.sha256, source_root: "beskid_bsol", include: ["conformance", "schemas"], corpus: "conformance" } : null;
    const fixtureName = /^R4-PROC-/.test(item.id) ? "beskid_release_fixture" : null;
    const env = {};
    if (execution === "installed_host_harness") env.BESKID_V06_QUALIFIED_PREFIX = "{installed_prefix}";
    if (input) env.BESKID_BSOL_CORPUS = "{input_root}/conformance";
    if (fixtureName) env.BESKID_V06_RELEASE_FIXTURE = "{fixture}";
    const command = execution === "installed_native"
      ? { argv: ["{installed_cli}", "test", "--plain", "--json", "--project", "{installed_corelib}/CoreLib.bws", "--target", "reader-fixture-target", "--target-timeout", "900"], tool_file: "{installed_cli}", env }
      : { argv: ["{harness}", "--exact", "{test_id}", "--test-threads=1", "--nocapture"], tool_file: "{harness}", env };
    item.binding = {
      harness_language: language, harness_source, source_file, required_test_ids: ids, command, input, fixture: fixtureName,
      assertion_provenance, reviewed_source_binding: true, log: caseLogName(item.id),
      ...(execution === "installed_native" ? { target: "reader-fixture-target", project: "reader-fixture" } : { harness }),
      ...(profile_assertions.length ? { profile_assertions } : {}), ...(obligation_assertions.length ? { obligation_assertions } : {}),
    };
    if (item.id === "SER-04") item.binding.related_evidence = [{ kind: "cargo_test", crate: "beskid_analysis", test_ids: ["reader_fixture_related"] }];
    const toolFile = execution === "installed_native" ? cli.path : harnesses[harness].path;
    const toolSha = execution === "installed_native" ? cli.sha256 : harnesses[harness].sha256;
    const resolvedEnv = Object.fromEntries(Object.entries(env).map(([key, value]) => [key,
      value === "{installed_prefix}" ? PREFIX : value === "{input_root}/conformance" ? "/producer/tmp/corpus/conformance" : `/producer/out/${fixtures[fixtureName].path}`]));
    const resolvedCommand = execution === "installed_native"
      ? { argv: [installed_cli, "test", "--plain", "--json", "--project", `${PREFIX}/beskid_corelib/CoreLib.bws`, "--target", "reader-fixture-target", "--target-timeout", "900"], tool_file: installed_cli, tool_sha256: toolSha, version: `${toolFile}@${toolSha}`, installed_cli, env: resolvedEnv }
      : { argv: [`/producer/out/${toolFile}`, "--exact", "{test_id}", "--test-threads=1", "--nocapture"], tool_file: `/producer/out/${toolFile}`, tool_sha256: toolSha, version: `${toolFile}@${toolSha}`, installed_cli, env: resolvedEnv };
    const stdoutText = execution === "installed_native"
      ? JSON.stringify({ target: "reader-fixture-target", summary: { passed: ids.length + 1, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 },
        tests: [...ids, extra].map(qualified_name => ({ name: qualified_name, qualified_name, outcome: "passed" })) })
      : ids.map(id => libtestSection(id, { qualified: qualified(id) })).join("");
    const stderrText = execution === "installed_native" ? "" : ids.map(id => invocationSection(id, cli.sha256, installedCliName)).join("");
    const stdout = retain(caseStdoutName(item.id), stdoutText);
    const stderr = retain(caseStderrName(item.id), stderrText);
    const artifact = fixtureName ? fixtures[fixtureName] : fingerprintFile;
    const row = {
      id: item.id, requirement_ids: item.requirement_ids, status: "success", exit_code: 0, timed_out: false, source: SOURCE, target,
      runtime_kit_sha256: runtime.sha256, candidate_cli_sha256: cli.sha256, candidate_bundle_sha256: bundle.sha256,
      harness_source, command: resolvedCommand, input_sha256: input ? input.sha256 : null, artifact: artifact.path, artifact_sha256: artifact.sha256,
      stdout: stdout.path, stdout_sha256: stdout.sha256, stderr: stderr.path, stderr_sha256: stderr.sha256,
      tests: (execution === "installed_native" ? [...ids, extra] : ids).map(id => ({ id, outcome: "passed" })), log: caseLogName(item.id),
    };
    const retained = retain(row.log, JSON.stringify(row));
    row.log_sha256 = retained.sha256;
    feature.cases.push(row);
    packetFiles.add(stdout.path); packetFiles.add(stderr.path); packetFiles.add(row.log);
  }
  manifest.packet_files = [...packetFiles].sort();
  const value = { feature, manifest, expected: { source: SOURCE, target, version: "0.6.0", case_manifest_sha256: null,
    packet_root, packet_files, runtime_kit_sha256: runtime.sha256, runtime_abi_sha256: abi.sha256,
    candidate_cli_sha256: cli.sha256, candidate_bundle_sha256: bundle.sha256, installed_cli }, cli, installedCliName, retain, ids: id => manifest.cases.find(item => item.id === id).binding.required_test_ids };
  refreeze(value);
  return value;
}
/** Recompute the frozen manifest bytes, their digest and the packet copy after a manifest mutation. */
function refreeze(value, { bytes } = {}) {
  value.manifestBytes = bytes ?? CanonicalManifestBytes(value.manifest);
  const digest = ManifestDigest(value.manifestBytes);
  value.expected.case_manifest_sha256 = digest;
  value.feature.case_manifest_sha256 = digest;
  value.retain(MANIFEST_FILE, value.manifestBytes);
  return value;
}
/** Rewrite one retained packet file and the digests that reference it. */
function rewriteRow(value, id, mutate) {
  const row = value.feature.cases.find(item => item.id === id);
  mutate(row);
  const retained = value.retain(row.log, JSON.stringify({ ...row, log_sha256: undefined }));
  row.log_sha256 = retained.sha256;
}
function rewriteOutput(value, id, stream, text) {
  rewriteRow(value, id, row => { row[`${stream}_sha256`] = value.retain(row[stream], text).sha256; });
}
function validate(value) {
  assert.equal(typeof reader.ValidateV06FeatureEvidence, "function", "versioned reader API is required");
  return reader.ValidateV06FeatureEvidence(value.feature, value.manifestBytes, value.expected);
}
function reject(value, pattern) {
  assert.equal(typeof reader.ValidateV06FeatureEvidence, "function", "versioned reader API is required");
  assert.throws(() => reader.ValidateV06FeatureEvidence(value.feature, value.manifestBytes, value.expected), pattern);
}
const nativeCase = "foundations.time";
const hostCase = "DEP06-02";

test("the draft manifest retains all mandatory IDs and only reviewed bindings", () => {
  assert.equal(planned.cases.length, 95);
  assert.equal(planned.cases.filter(item => item.spec_change === null).length, 16);
  assert.equal(new Set(planned.cases.map(item => item.id)).size, 95);
  assert.equal(planned.provisional_cases.length, 15);
  assert(planned.provisional_cases.every(item => item.moved_from === "v06-rust-glue-integration" && typeof item.reason === "string" && item.reason.length > 0));
  // R4-IO-* live on in the provisional stdio bridge change; R4-GEN-04..06 (Glue Mod contracts) are deleted in 0.6 and kept by no change.
  assert(planned.provisional_cases.filter(item => item.id.startsWith("R4-IO-")).every(item => item.spec_change === "v06-glue-stdio-bridge-provisional"));
  assert(planned.provisional_cases.filter(item => item.id.startsWith("R4-GEN-")).every(item => item.spec_change === null && /deleted in 0\.6\.0/.test(item.reason)));
  assert(!planned.cases.some(item => PROVISIONAL_IDS.includes(item.id)));
  assert.equal(planned.rust_profile.transport, undefined);
  assert.equal(planned.required_obligations.stdio, undefined);
  assert.equal(planned.policy.all_cases_mandatory, true);
  assert.equal(planned.policy.provisional_cases_reject, true);
  assert.deepEqual(Object.keys(planned.execution_kinds).sort(), ["installed_host_harness", "installed_native"]);
  const bound = planned.cases.filter(item => item.binding !== null);
  for (const item of bound) {
    const ids = item.binding.required_test_ids;
    assert(Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length, `${item.id} binding must list unique test ids`);
    assert(typeof item.binding.target === "string" || typeof item.binding.harness === "string", `${item.id} binding must name a target or harness`);
  }
  if (planned.state === "frozen") assert.equal(bound.length, planned.cases.length);
  else assert(planned.cases.some(item => item.binding === null), "an unfrozen manifest has at least one unbound case");
  assert(!planned.cases.some(item => item.binding?.project === "reader-fixture"), "synthetic fixture bindings never enter the manifest");
  assert(Buffer.from(CanonicalManifestBytes(planned)).equals(readFileSync(new URL("../release-cases-v06.json", import.meta.url))), "the manifest file is canonical JSON");
});
test("binding fragments name real declarations and never provisional or library-only ids", () => {
  const directory = new URL("../release-case-bindings/", import.meta.url);
  const fragments = readdirSync(directory).filter(name => name.endsWith(".json"));
  assert(fragments.includes("baseline.json") && fragments.includes("host.json"));
  const seen = new Set();
  for (const name of fragments) {
    const fragment = JSON.parse(readFileSync(new URL(name, directory)));
    assert.equal(fragment.schema_version, 1);
    for (const [id, binding] of Object.entries(fragment.cases)) {
      assert(!PROVISIONAL_IDS.includes(id), `${name} binds provisional ${id}`);
      assert(!seen.has(id), `${id} bound by two fragments`);
      seen.add(id);
      const item = planned.cases.find(item => item.id === id);
      assert(item, `${name} binds unknown case ${id}`);
      assert.equal(binding.execution, item.execution, `${id} execution kind`);
      assert(existsSync(new URL(binding.source_file, repo)), `${id} source ${binding.source_file} missing`);
      assert.equal(typeof binding.target === "string", binding.execution === "installed_native");
      assert.equal(typeof binding.harness === "string", binding.execution === "installed_host_harness");
      const source = readFileSync(new URL(binding.source_file, repo));
      for (const testId of binding.required_test_ids) {
        if (binding.execution === "installed_host_harness") assert.equal(findRustDeclaration(source, testId).length, 1, `${id} declares ${testId} once`);
        else assert(source.toString().split("\n").some(line => line.startsWith(`test ${testId}`)), `${id} declares ${testId}`);
      }
      for (const related of binding.related_evidence ?? []) for (const testId of related.test_ids ?? []) assert(!binding.required_test_ids.includes(testId), `${id} requires library-only ${testId}`);
    }
  }
  const check = spawnSync(process.execPath, [new URL("../freeze-release-cases-v06.mjs", import.meta.url).pathname, "--check"], { encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr);
});
test("harness crates cannot reach the checkout or the build-tree CLI", () => {
  for (const crate of ["beskid_tests_release", "beskid_tests_interop"]) {
    const cargo = readFileSync(new URL(`compiler/crates/${crate}/Cargo.toml`, repo), "utf8");
    assert.doesNotMatch(cargo, /^beskid_cli\b/m, `${crate} must not depend on beskid_cli`);
  }
  const sources = [];
  const walk = directory => { for (const entry of readdirSync(directory, { withFileTypes: true })) { const path = join(directory, entry.name); if (entry.isDirectory()) walk(path); else if (entry.name.endsWith(".rs")) sources.push(path); } };
  walk(new URL("compiler/crates/beskid_tests_release/", repo).pathname);
  assert(sources.length >= 5);
  for (const path of sources) {
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(text, /CARGO_MANIFEST_DIR|CARGO_BIN_EXE_/, `${path} reaches the checkout`);
  }
});
test("complete reader-only matrix has a success path on every required native target", () => {
  for (const target of planned.targets) assert.doesNotThrow(() => validate(fixture(target)));
});
test("every mandatory case is required independently including retained baselines", () => {
  for (const item of planned.cases) {
    const value = fixture(); value.feature.cases = value.feature.cases.filter(row => row.id !== item.id);
    reject(value, new RegExp(item.id.replace(".", "\\.")));
  }
});
test("provisional ids are a deny list: cases, rows, profile and obligation rows naming them reject", () => {
  const manifestCase = fixture();
  manifestCase.manifest.cases.push({ ...structuredClone(manifestCase.manifest.cases[16]), id: "R4-IO-01", requirement_ids: ["R4-IO-01"] });
  refreeze(manifestCase); reject(manifestCase, /provisional/);
  const row = fixture(); row.feature.cases.push({ ...row.feature.cases[16], id: "R4-IO-01", requirement_ids: ["R4-IO-01"] });
  reject(row, /provisional/);
  const profile = fixture(); profile.feature.rust_profile_matrix[0].case_id = "R4-GEN-04"; reject(profile, /provisional/);
  const obligation = fixture(); obligation.feature.obligation_matrix[0].case_id = "R4-IO-05"; reject(obligation, /provisional/);
  const stdio = fixture(); stdio.manifest.rust_profile.transport = "stdio"; refreeze(stdio); reject(stdio, /stdio|transport/);
  const stdioObligation = fixture(); stdioObligation.manifest.required_obligations.stdio = ["fragmented_frame"]; refreeze(stdioObligation); reject(stdioObligation, /obligation/);
});
test("scalar-only Glue cannot satisfy the full manual/generated import/export profile", () => {
  const value = fixture(); value.feature.rust_profile_matrix = value.feature.rust_profile_matrix.filter(row => row.representation === "i64");
  reject(value, /profile|matrix|representation/i);
});
test("complete dimension labels cannot borrow an unrelated passing scalar assertion", () => {
  const value = fixture();
  value.feature.rust_profile_matrix[0].case_id = nativeCase;
  value.feature.rust_profile_matrix[0].test_id = value.ids(nativeCase)[0];
  reject(value, /profile|assertion|bind/i);
});
test("native executed outcomes are derived from the raw beskid test report, not the row", () => {
  const value = fixture();
  const ids = value.ids(nativeCase);
  const report = JSON.parse(readFileSync(join(value.expected.packet_root, caseStdoutName(nativeCase)), "utf8"));
  for (const outcome of ["failed", "skipped", "filtered_out", "timed_out"]) {
    const broken = fixture();
    const mutated = structuredClone(report);
    // A non-required test in the same target fails while the row still claims only passes.
    mutated.tests.at(-1).outcome = outcome; mutated.summary.passed -= 1; mutated.summary[outcome] += 1;
    rewriteOutput(broken, nativeCase, "stdout", JSON.stringify(mutated));
    reject(broken, /skipped, filtered, timed-out, or failed/);
  }
  const missing = fixture();
  const dropped = structuredClone(report);
  dropped.tests = dropped.tests.filter(test => test.qualified_name !== ids[0]); dropped.summary.passed -= 1;
  rewriteRow(missing, nativeCase, row => { row.tests = row.tests.filter(test => test.id !== ids[0]); });
  rewriteOutput(missing, nativeCase, "stdout", JSON.stringify(dropped));
  reject(missing, /required assertion .* was not executed/);
  const claimed = fixture();
  rewriteRow(claimed, nativeCase, row => { row.tests = row.tests.filter(test => ids.includes(test.id)); });
  reject(claimed, /derived executed assertions/);
  const wrongTarget = fixture();
  rewriteOutput(wrongTarget, nativeCase, "stdout", JSON.stringify({ ...report, target: "OtherSuite" }));
  reject(wrongTarget, /target/);
});
test("host executed outcomes are derived from raw libtest output and installed invocation proof", () => {
  const probe = fixture();
  const ids = probe.ids(hostCase);
  const hostBinding = probe.manifest.cases.find(item => item.id === hostCase).binding;
  const qualified = id => libtestPath(hostBinding.source_file, probe.manifest.harness_executables[hostBinding.harness].source_root, id);
  const passing = fixture();
  assert.doesNotThrow(() => validate(passing));
  for (const [label, section] of [["FAILED", libtestSection(ids[0], { outcome: "FAILED", exit: 101, qualified: qualified(ids[0]) })], ["running 0 tests", libtestSection(ids[0], { running: 0 })],
    ["ignored", libtestSection(ids[0], { outcome: "ignored", qualified: qualified(ids[0]) })], ["unqualified", libtestSection(ids[0])]]) {
    const value = fixture();
    rewriteOutput(value, hostCase, "stdout", section + libtestSection(ids[1], { qualified: qualified(ids[1]) }));
    reject(value, /did not exit successfully|failed, skipped or nonexecuted/, label);
  }
  const unsectioned = fixture();
  rewriteOutput(unsectioned, hostCase, "stdout", `running 1 test\ntest ${ids[0]} ... ok\n`);
  reject(unsectioned, /section|outside/);
  const absent = fixture();
  rewriteOutput(absent, hostCase, "stdout", libtestSection(ids[1], { qualified: qualified(ids[1]) }));
  reject(absent, /executed assertion sections/);
  const noProof = fixture();
  rewriteOutput(noProof, hostCase, "stderr", `beskid-release-case begin test=${ids[0]}\nbeskid-release-case end test=${ids[0]} exit=0 timed_out=false\n${invocationSection(ids[1], noProof.cli.sha256, noProof.installedCliName)}`);
  reject(noProof, /no installed invocation proof/);
  const foreign = fixture();
  rewriteOutput(foreign, hostCase, "stderr", invocationSection(ids[0], "0".repeat(64), foreign.installedCliName) + invocationSection(ids[1], foreign.cli.sha256, foreign.installedCliName));
  reject(foreign, /other than the installed candidate/);
  const developer = fixture();
  rewriteOutput(developer, hostCase, "stderr", invocationSection(ids[0], developer.cli.sha256, "beskid_cli") + invocationSection(ids[1], developer.cli.sha256, developer.installedCliName));
  reject(developer, /other than the installed candidate/);
  const noPrefix = fixture();
  rewriteRow(noPrefix, hostCase, row => { row.command.env = {}; });
  reject(noPrefix, /env|prefix/);
});
for (const field of ["source", "target", "runtime_kit_sha256", "artifact_sha256", "harness_source"])
  test(`consumed ${field} mismatch rejects stale evidence`, () => {
    const value = fixture(); value.feature.cases[16][field] = field === "source" ? { root: "4".repeat(40) } : "mismatch";
    reject(value, /source|target|runtime|artifact|harness/i);
  });
test("unbound obligations and the v0.5 Glue exemption cannot qualify 0.6", () => {
  const value = fixture(); value.manifest.cases[16].binding = null; refreeze(value);
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
  value.feature.cases.pop();
  const bytes = CanonicalManifestBytes(value.manifest);
  value.manifestBytes = bytes; value.feature.case_manifest_sha256 = ManifestDigest(bytes); value.retain(MANIFEST_FILE, bytes);
  reject(value, /manifest|frozen/i);
});
test("the frozen manifest digest is over canonical bytes; reformatted bytes reject", () => {
  const value = fixture();
  const reformatted = Buffer.from(JSON.stringify(JSON.parse(value.manifestBytes.toString()), null, 4));
  const stale = fixture(); stale.manifestBytes = reformatted; reject(stale, /manifest digest/);
  refreeze(value, { bytes: reformatted });
  reject(value, /canonical/);
});
test("every ownership failure and process obligation needs its own bound executed assertion", () => {
  for (const [kind, obligations] of Object.entries(planned.required_obligations)) for (const obligation of obligations) {
    const value = fixture(); value.feature.obligation_matrix = value.feature.obligation_matrix.filter(row => !(row.kind === kind && row.obligation === obligation));
    reject(value, /obligation|ownership|process|failure/i);
  }
  const value = fixture(); value.feature.obligation_matrix[0].case_id = nativeCase;
  value.feature.obligation_matrix[0].test_id = value.ids(nativeCase)[0];
  reject(value, /obligation|assertion|binding/i);
});
for (const field of ["command", "input_sha256", "stdout_sha256", "stderr_sha256", "log_sha256"])
  test(`forged ${field} evidence rejects`, () => {
    const value = fixture(); value.feature.cases[16][field] = field === "command" ? { argv: ["forged-tool"], tool_sha256: "0".repeat(64) } : "0".repeat(64);
    reject(value, /command|tool|input|stdout|stderr|log|digest/i);
  });
test("retained packet closure rejects missing tampered extra and symlinked files", () => {
  for (const mutate of [
    value => rmSync(join(value.expected.packet_root, inputPacketName("bsol-corpus"))),
    value => writeFileSync(join(value.expected.packet_root, caseStdoutName(nativeCase)), "tampered"),
    value => writeFileSync(join(value.expected.packet_root, "undeclared.log"), "extra"),
    value => { rmSync(join(value.expected.packet_root, caseStdoutName(nativeCase))); symlinkSync(caseStderrName(nativeCase), join(value.expected.packet_root, caseStdoutName(nativeCase))); },
  ]) { const value = fixture(); mutate(value); reject(value, /packet|file|digest|symlink|regular/i); }
});
test("target packet files carry the harness executables with the Windows extension", () => {
  for (const target of planned.targets) {
    const value = fixture(target);
    const expectedName = `harness-beskid_tests_release${target.includes("windows") ? ".exe" : ""}`;
    assert(value.manifest.target_packet_files[target].includes(expectedName));
    value.manifest.target_packet_files[target] = value.manifest.target_packet_files[target].filter(name => name !== expectedName);
    refreeze(value);
    reject(value, /harness beskid_tests_release is not retained/);
  }
  const missingFixture = fixture();
  missingFixture.manifest.target_packet_files[planned.targets[0]] = missingFixture.manifest.target_packet_files[planned.targets[0]].filter(name => !name.startsWith("fixture-"));
  refreeze(missingFixture); reject(missingFixture, /fixture .* is not retained/);
});
test("command templates resolve to the installed candidate and the retained harness only", () => {
  const developer = fixture();
  rewriteRow(developer, nativeCase, row => { row.command.argv[0] = "/developer/target/release/beskid_cli"; });
  reject(developer, /command|installed|tool/i);
  const otherTarget = fixture();
  rewriteRow(otherTarget, nativeCase, row => { row.command.argv[7] = "OtherSuite"; });
  reject(otherTarget, /frozen template/);
  const foreignHarness = fixture();
  rewriteRow(foreignHarness, hostCase, row => { row.command.argv[0] = "/producer/out/harness-other"; row.command.tool_file = "/producer/out/harness-other"; });
  reject(foreignHarness, /retained harness/);
  const windows = fixture(planned.targets[2]);
  rewriteRow(windows, nativeCase, row => { row.command.argv[0] = `${PREFIX}\\bin\\beskid.exe`; row.command.tool_file = row.command.argv[0]; row.command.argv[5] = `${PREFIX}\\beskid_corelib\\CoreLib.bws`; });
  assert.doesNotThrow(() => validate(windows), "backslash paths from the Windows producer compare by segments");
  // A Windows packet is validated on the Linux release runner: its recorded harness and fixture paths
  // name the retained executable by their last segment whatever the separator.
  const windowsPath = path => path.replace("/producer/out/", "C:\\producer\\out\\");
  const windowsHost = fixture(planned.targets[2]);
  for (const id of [hostCase, "R4-PROC-01"]) rewriteRow(windowsHost, id, row => {
    row.command.argv[0] = windowsPath(row.command.argv[0]); row.command.tool_file = windowsPath(row.command.tool_file);
    for (const key of Object.keys(row.command.env)) row.command.env[key] = windowsPath(row.command.env[key]);
  });
  assert.match(windowsHost.feature.cases.find(row => row.id === hostCase).command.argv[0], /^C:\\producer\\out\\harness-beskid_tests_release\.exe$/);
  assert.doesNotThrow(() => validate(windowsHost), "Windows-recorded harness paths name the retained harness");
  const windowsForeign = fixture(planned.targets[2]);
  rewriteRow(windowsForeign, hostCase, row => { row.command.argv[0] = "C:\\producer\\out\\harness-other.exe"; row.command.tool_file = row.command.argv[0]; });
  reject(windowsForeign, /retained harness/);
  const windowsForeignFixture = fixture(planned.targets[2]);
  rewriteRow(windowsForeignFixture, "R4-PROC-01", row => { row.command.env.BESKID_V06_RELEASE_FIXTURE = "C:\\producer\\out\\fixture-other.exe"; });
  reject(windowsForeignFixture, /retained fixture/);
  const extraEnv = fixture();
  rewriteRow(extraEnv, nativeCase, row => { row.command.env.BESKID_CORELIB_ROOT = "/developer/corelib"; });
  reject(extraEnv, /env keys/);
});
test("runtime ABI and installed candidate receipt ownership are independently pinned", () => {
  const wrongAbi = fixture(); wrongAbi.feature.runtime_kit.abi_sha256 = "0".repeat(64); reject(wrongAbi, /ABI|abi|runtime/i);
  for (const field of ["version", "runtime_kit_sha256", "abi_sha256", "bundle_sha256", "cli", "corelib_fingerprint"]) {
    const value = fixture(); const path = join(value.expected.packet_root, INSTALLED_RECEIPT);
    const receipt = JSON.parse(readFileSync(path)); receipt[field] = "forged";
    writeFileSync(path, JSON.stringify(receipt)); value.expected.packet_files[INSTALLED_RECEIPT] = bytesDigest(readFileSync(path));
    value.feature.installed_prefix.manifest_sha256 = value.expected.packet_files[INSTALLED_RECEIPT];
    reject(value, /installed|receipt|bundle|runtime|ABI|abi|version|cli|fingerprint/i);
  }
  for (const relative of ["beskid", "../bin/beskid", "/opt/beskid/bin/beskid", "lib/beskid", "bin/beskid_cli"]) {
    const value = fixture(); const path = join(value.expected.packet_root, INSTALLED_RECEIPT);
    const receipt = JSON.parse(readFileSync(path)); receipt.cli.relative_path = relative;
    writeFileSync(path, JSON.stringify(receipt)); value.expected.packet_files[INSTALLED_RECEIPT] = bytesDigest(readFileSync(path));
    value.feature.installed_prefix.manifest_sha256 = value.expected.packet_files[INSTALLED_RECEIPT];
    reject(value, /relative path|bin\/beskid|ownership/);
  }
});
test("a source hash without reviewed actual test declarations cannot bind assertions", () => {
  const value = fixture(); value.manifest.cases[16].binding.assertion_provenance[0].declaration = "test invented_test";
  refreeze(value);
  reject(value, /assertion|declaration|source.*binding|provenance/i);
});
test("Rust declaration grammar accepts indented test modules and rejects gated or attributed declarations", () => {
  const source = Buffer.from("mod tests {\n    #[test]\n    fn plain() {}\n\n    #[test]\n    #[ignore]\n    fn ignored() {}\n\n    #[cfg(any())]\n    fn gated() {}\n\n    #[test]\n  fn misaligned() {}\n    #[test]\n    fn twice() {}\n    #[test]\n    fn twice() {}\n}\n");
  assert.equal(findRustDeclaration(source, "plain").length, 1);
  assert.equal(findRustDeclaration(source, "ignored").length, 0);
  assert.equal(findRustDeclaration(source, "gated").length, 0);
  assert.equal(findRustDeclaration(source, "misaligned").length, 0);
  assert.equal(findRustDeclaration(source, "twice").length, 2);
  const value = fixture();
  const binding = value.manifest.cases.find(item => item.id === hostCase).binding;
  const text = readFileSync(join(value.expected.packet_root, binding.harness_source.path), "utf8").replace(`#[test]\n    fn ${binding.required_test_ids[0]}(`, `#[test]\n    #[ignore]\n    fn ${binding.required_test_ids[0]}(`);
  const harness = value.retain(binding.harness_source.path, text);
  binding.harness_source = harness;
  for (const proof of binding.assertion_provenance) proof.source = harness;
  rewriteRow(value, hostCase, row => { row.harness_source = harness; });
  refreeze(value);
  reject(value, /declaration/);
});
test("library-level related evidence is recorded but never required", () => {
  const value = fixture();
  assert.doesNotThrow(() => validate(value));
  const binding = value.manifest.cases.find(item => item.id === "SER-04").binding;
  assert.equal(binding.related_evidence[0].kind, "cargo_test");
  binding.unknown_field = true; refreeze(value);
  reject(value, /undeclared field/);
});

function nativeDeclarationFixture(transform = bytes => bytes) {
  // Real source declaration, synthetic execution receipt: reader coverage only.
  const value = fixture();
  const source = transform(readFileSync(new URL("compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd", repo)));
  const test_id = "bsol_serialization_wire_exact_unsigned_width";
  const declaration = `test ${test_id}`;
  const start = source.indexOf(Buffer.from(declaration));
  assert(start >= 0);
  const source_file = "compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd";
  const harness = value.retain(sourcePacketName(source_file), source);
  const item = value.manifest.cases.find(item => item.id === nativeCase);
  const binding = item.binding;
  Object.assign(binding, { harness_language: "beskid", harness_source: harness, source_file,
    required_test_ids: [test_id], assertion_provenance: [{ test_id, source: harness, start,
      end: start + Buffer.byteLength(declaration), declaration }] });
  rewriteRow(value, nativeCase, row => {
    row.harness_source = harness;
    row.tests = [{ id: test_id, outcome: "passed" }];
    row.stdout_sha256 = value.retain(row.stdout, JSON.stringify({ target: binding.target, summary: { passed: 1, failed: 0, skipped: 0, filtered_out: 0, timed_out: 0 }, tests: [{ name: test_id, qualified_name: test_id, outcome: "passed" }] })).sha256;
  });
  value.manifest.packet_files = [...new Set([...value.manifest.packet_files, harness.path])].sort();
  refreeze(value);
  return value;
}

test("native Beskid test declarations can bind real source without a Node wrapper", () => {
  assert.doesNotThrow(() => validate(nativeDeclarationFixture()));
});
test("assertion declaration language is mandatory and cannot be relabeled", () => {
  for (const language of [undefined, "unknown", "node", "rust"]) {
    const value = nativeDeclarationFixture();
    value.manifest.cases.find(item => item.id === nativeCase).binding.harness_language = language;
    refreeze(value);
    reject(value, /language|declaration/i);
  }
});
test("native declaration cannot bind a prefix of another test identifier", () => {
  const value = nativeDeclarationFixture(bytes => Buffer.from(bytes.toString().replace(
    "test bsol_serialization_wire_exact_unsigned_width", "test bsol_serialization_wire_exact_unsigned_width_extra")));
  reject(value, /declaration/);
});

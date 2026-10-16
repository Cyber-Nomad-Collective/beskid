// End to end: freeze a fixture manifest, run the schema-2 producer against a fake installed bundle and
// fake harness executables, then validate the produced directory with the real reader seam.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { FreezeManifest } from "../freeze-release-cases-v06.mjs";
import { ValidateV06FeatureEvidence } from "../woodpecker-release-evidence.mjs";
import { RuntimeKitReceiptBytes } from "../woodpecker-runtime-kit-digest.mjs";
import { CanonicalManifestBytes, ManifestDigest, libtestPath } from "../release-case-common.mjs";

const producer = new URL("../woodpecker-release-cases-v06.mjs", import.meta.url).pathname;
const planned = JSON.parse(readFileSync(new URL("../release-cases-v06.json", import.meta.url)));
const TARGET = "x86_64-unknown-linux-gnu";
const VERSION = "0.6.0";
const SOURCE = { superrepo_commit: "a".repeat(40), compiler_commit: "b".repeat(40) };
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const identifier = id => `fixture_${id.replace(/[^A-Za-z0-9_]/g, "_")}`;
const HOST_HARNESS = { "R4-ABI": "beskid_tests_interop", "R4-BIND": "beskid_tests_interop", "R4-CALL": "beskid_tests_interop", "R4-GEN": "beskid_tests_interop", "R4-TOOL": "beskid_tests_interop", "GLUE066-01": "beskid_tests_interop" };

/** A fixture checkout: every case bound to a synthetic source under the layout the freeze tool expects. */
function fixtureRepo(root) {
  const fragment = { schema_version: 1, slice: "fixture", cases: {} };
  const nativeTargets = new Map();
  for (const item of planned.cases) {
    const ids = [`${identifier(item.id)}_a`, `${identifier(item.id)}_b`];
    if (item.execution === "installed_native") {
      const target = `Suite_${identifier(item.id)}`;
      const file = `compiler/corelib/beskid_corelib/tests/corelib_tests/src/fixture/${target}.bd`;
      mkdirSync(join(root, "compiler/corelib/beskid_corelib/tests/corelib_tests/src/fixture"), { recursive: true });
      writeFileSync(join(root, file), ids.map(id => `test ${id} {\n}\n`).join("\n") + `\ntest ${identifier(item.id)}_extra {\n}\n`);
      nativeTargets.set(target, [...ids, `${identifier(item.id)}_extra`]);
      fragment.cases[item.id] = { execution: "installed_native", target, project: "compiler/corelib/beskid_corelib/tests/corelib_tests", source_file: file, required_test_ids: ids,
        input: null, fixture: /^R4-PROC-/.test(item.id) ? "beskid_release_fixture" : null };
    } else {
      const harness = HOST_HARNESS[item.id.split("-").slice(0, 2).join("-")] ?? "beskid_tests_release";
      const file = harness === "beskid_tests_interop" ? `compiler/crates/beskid_tests_interop/src/interop/${identifier(item.id)}.rs` : `compiler/crates/beskid_tests_release/tests/${identifier(item.id)}.rs`;
      mkdirSync(join(root, file, ".."), { recursive: true });
      writeFileSync(join(root, file), ids.map(id => `#[test]\nfn ${id}() {}\n`).join("\n"));
      const binding = { execution: "installed_host_harness", harness, source_file: file, required_test_ids: ids, input: item.id === "BSOL-06-01" ? { id: "bsol-corpus", source_root: "beskid_bsol", include: ["conformance", "schemas"], corpus: "conformance" } : null, fixture: null };
      if (item.id === "R4-ABI-01") {
        binding.profile_assertions = [];
        for (const representation of planned.rust_profile.representations) for (const implementation of planned.rust_profile.implementations) for (const direction of planned.rust_profile.directions) {
          const test_id = `${identifier(item.id)}_${representation}_${implementation}_${direction}`;
          binding.required_test_ids.push(test_id);
          binding.profile_assertions.push({ representation, implementation, direction, test_id });
        }
        writeFileSync(join(root, file), binding.required_test_ids.map(id => `#[test]\nfn ${id}() {}\n`).join("\n"));
      }
      const obligationCase = { ownership: "R4-ABI-10", failure: "R4-ABI-05", process: null }[Object.keys(planned.required_obligations).find(kind => ({ ownership: "R4-ABI-10", failure: "R4-ABI-05" })[kind] === item.id) ?? "process"];
      if (obligationCase === item.id) {
        const kind = item.id === "R4-ABI-10" ? "ownership" : "failure";
        binding.obligation_assertions = planned.required_obligations[kind].map(obligation => ({ kind, obligation, test_id: `${identifier(item.id)}_${kind}_${obligation}` }));
        binding.required_test_ids.push(...binding.obligation_assertions.map(proof => proof.test_id));
        writeFileSync(join(root, file), binding.required_test_ids.map(id => `#[test]\nfn ${id}() {}\n`).join("\n"));
      }
      fragment.cases[item.id] = binding;
    }
  }
  // Process obligations live on the native R4-PROC-01 case.
  const proc = fragment.cases["R4-PROC-01"];
  proc.obligation_assertions = planned.required_obligations.process.map(obligation => ({ kind: "process", obligation, test_id: `${identifier("R4-PROC-01")}_process_${obligation}` }));
  proc.required_test_ids.push(...proc.obligation_assertions.map(proof => proof.test_id));
  writeFileSync(join(root, proc.source_file), proc.required_test_ids.map(id => `test ${id} {\n}\n`).join("\n"));
  nativeTargets.set(proc.target, proc.required_test_ids);
  mkdirSync(join(root, "beskid_bsol/conformance/cases"), { recursive: true });
  writeFileSync(join(root, "beskid_bsol/conformance/cases/v06-values.bsol"), "config { count = 1 }\n");
  mkdirSync(join(root, "beskid_bsol/schemas"), { recursive: true });
  writeFileSync(join(root, "beskid_bsol/schemas/schema.v1.bsol"), "schema \"schema.v1\" { }\n");
  // Sibling sources outside the declared include list never enter the packet input.
  mkdirSync(join(root, "beskid_bsol/crates"), { recursive: true });
  writeFileSync(join(root, "beskid_bsol/crates/excluded.rs"), "fn main() {}\n");
  // The fixture binds every case afresh; the reviewed baseline bindings of the real manifest stay untouched.
  const draft = structuredClone(planned);
  for (const item of draft.cases) item.binding = null;
  const frozen = FreezeManifest(CanonicalManifestBytes(draft), [["fixture.json", fragment]], root);
  return { manifestBytes: frozen.bytes, manifest: frozen.manifest, nativeTargets };
}

function fakeBundle(root, nativeTargets) {
  const bundle = join(root, `beskid-${VERSION}-${TARGET}`);
  for (const directory of ["bin", `lib/beskid-runtime/abi-5/${TARGET}/release`, `lib/beskid-runtime/abi-5/${TARGET}/debug`, "beskid_corelib", "fake-tests"]) mkdirSync(join(bundle, directory), { recursive: true });
  for (const [target, names] of nativeTargets) writeFileSync(join(bundle, "fake-tests", `${target}.txt`), `${names.join("\n")}\n`);
  writeFileSync(join(bundle, "bin/beskid"), `#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "\${1:-}" == --version ]]; then echo "beskid ${VERSION}"; exit 0; fi
[[ "\${1:-}" == test ]] || { echo "fake cli: unsupported \$*" >&2; exit 2; }
target=""; prev=""
for arg in "$@"; do [[ "$prev" == --target ]] && target="$arg"; prev="$arg"; done
[[ -n "\${HOME:-}" && "\${BESKID_CORELIB_ROOT:-unset}" == unset ]] || { echo "fake cli: developer overrides present" >&2; exit 3; }
names="$here/fake-tests/$target.txt"
[[ -f "$names" ]] || { echo "fake cli: unknown target $target" >&2; exit 1; }
count="$(wc -l <"$names" | tr -d ' ')"
tests="$(awk 'BEGIN{ORS=""} {if (NR>1) print ","; printf "{\\"name\\":\\"%s\\",\\"qualified_name\\":\\"%s\\",\\"outcome\\":\\"passed\\"}", $1, $1}' "$names")"
printf '{"target":"%s","summary":{"passed":%s,"failed":0,"skipped":0,"filtered_out":0,"timed_out":0},"tests":[%s]}\\n' "$target" "$count" "$tests"
echo "progress on stderr" >&2
`);
  chmodSync(join(bundle, "bin/beskid"), 0o755);
  writeFileSync(join(bundle, "beskid_corelib/CoreLib.bws"), "workspace { name = \"corelib\" }\n");
  writeFileSync(join(bundle, "beskid_corelib/.beskid-bundle.sha256"), `${"5".repeat(64)}\n`);
  writeFileSync(join(bundle, `lib/beskid-runtime/abi-5/${TARGET}/release/abi.json`), "{\"abi\":5}\n");
  writeFileSync(join(bundle, `lib/beskid-runtime/abi-5/${TARGET}/debug/abi.json`), "{\"abi\":5,\"profile\":\"debug\"}\n");
  return bundle;
}

function fakeHarnesses(root, manifest, { proof = true } = {}) {
  const directory = join(root, "harness");
  mkdirSync(directory, { recursive: true });
  for (const name of Object.keys(manifest.harness_executables)) {
    writeFileSync(join(directory, `harness-${name}`), `#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == --exact && "$3" == --test-threads=1 && "$4" == --nocapture ]] || { echo "fake harness: unexpected arguments $*" >&2; exit 2; }
[[ -n "\${BESKID_V06_QUALIFIED_PREFIX:-}" ]] || { echo "fake harness: no qualified prefix" >&2; exit 3; }
if [[ -n "\${BESKID_BSOL_CORPUS:-}" ]]; then
  # Packet-mode corpus layout: cases under the corpus root, profiles at ../schemas, nothing else archived.
  [[ "$(basename "$BESKID_BSOL_CORPUS")" == conformance && -f "$BESKID_BSOL_CORPUS/cases/v06-values.bsol" && -f "$BESKID_BSOL_CORPUS/../schemas/schema.v1.bsol" ]] || { echo "fake harness: corpus layout missing" >&2; exit 4; }
  [[ ! -e "$BESKID_BSOL_CORPUS/../crates" ]] || { echo "fake harness: input archived an excluded directory" >&2; exit 5; }
fi
if command -v sha256sum >/dev/null 2>&1; then digest="$(sha256sum "\${BESKID_V06_QUALIFIED_PREFIX}/bin/beskid" | awk '{print $1}')"; else digest="$(shasum -a 256 "\${BESKID_V06_QUALIFIED_PREFIX}/bin/beskid" | awk '{print $1}')"; fi
${proof ? 'echo "beskid-installed-invocation sha256=$digest argv0=beskid" >&2' : 'echo "no proof" >&2'}
printf '\\nrunning 1 test\\ntest %s ... ok\\n\\ntest result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 7 filtered out; finished in 0.00s\\n\\n' "$2"
`);
    chmodSync(join(directory, `harness-${name}`), 0o755);
  }
  for (const name of Object.keys(manifest.fixture_executables)) {
    writeFileSync(join(directory, `fixture-${name}`), "#!/usr/bin/env bash\nexit 0\n");
    chmodSync(join(directory, `fixture-${name}`), 0o755);
  }
  return directory;
}

function platformOutput(root, bundle) {
  const output = join(root, "linux");
  mkdirSync(output);
  const cliBytes = readFileSync(join(bundle, "bin/beskid"));
  writeFileSync(join(output, "beskid-linux-amd64"), cliBytes);
  writeFileSync(join(output, "beskid_lsp-linux-amd64"), "fake lsp\n");
  writeFileSync(join(output, `beskid-${VERSION}-${TARGET}.tar.gz`), "fake bundle archive\n");
  const receipt = RuntimeKitReceiptBytes(join(bundle, `lib/beskid-runtime/abi-5/${TARGET}/release`));
  writeFileSync(join(output, "runtime-kit.json"), receipt);
  writeFileSync(join(output, `platform-result-${TARGET}.json`), JSON.stringify({ schema_version: 1, target: TARGET, stage: "native-release-build", builds: { cli: { status: "success", asset: "beskid-linux-amd64" }, lsp: { status: "success", asset: "beskid_lsp-linux-amd64" }, bundle: { status: "success", asset: `beskid-${VERSION}-${TARGET}.tar.gz` } }, diagnostics: [] }));
  const buildResult = { schema_version: 1, platform: "linux", target: TARGET, version: VERSION, channel: "stable", output_path: output, source: SOURCE,
    runtime_kit_sha256: sha256(receipt), runtime_abi_sha256: sha256(readFileSync(join(bundle, `lib/beskid-runtime/abi-5/${TARGET}/release/abi.json`))),
    installed_cli: join(bundle, "bin/beskid"), platform_result_status: "success", published: false, corelib_fingerprint: "5".repeat(64) };
  writeFileSync(join(output, "woodpecker-build-result.json"), JSON.stringify(buildResult));
  return { output, buildResult };
}

function scenario({ proof = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "beskid-v06-producer-"));
  const repo = join(root, "repo");
  mkdirSync(repo);
  const { manifestBytes, manifest, nativeTargets } = fixtureRepo(repo);
  const manifestPath = join(root, "release-cases-v06.json");
  writeFileSync(manifestPath, manifestBytes);
  const bundle = fakeBundle(root, nativeTargets);
  const harness = fakeHarnesses(root, manifest, { proof });
  const { output, buildResult } = platformOutput(root, bundle);
  const run = spawnSync(process.execPath, [producer, "linux", VERSION, output, bundle, "--harness-dir", harness, "--manifest", manifestPath, "--repo", repo, "--cell-timeout", "60"],
    { encoding: "utf8", env: { ...process.env, CI_PIPELINE_NUMBER: "", CI_COMMIT_SHA: "" } });
  return { root, repo, manifest, manifestBytes, bundle, output, buildResult, run };
}

test("the producer emits a schema-2 packet that the reader validates end to end", (t) => {
  const value = scenario();
  t.after(() => rmSync(value.root, { recursive: true, force: true }));
  assert.equal(value.run.status, 0, value.run.stderr);
  const names = readdirSync(value.output).sort();
  const packet_files = Object.fromEntries(names.map(name => [name, sha256(readFileSync(join(value.output, name)))]));
  const feature = JSON.parse(readFileSync(join(value.output, "feature-evidence-v2.json"), "utf8"));
  assert.equal(feature.cases.length, 95);
  assert(feature.cases.every(row => row.status === "success"));
  assert.equal(feature.rust_profile_matrix.length, 68);
  assert.equal(feature.obligation_matrix.length, 18);
  const native = feature.cases.find(row => row.id === "foundations.time");
  const report = JSON.parse(readFileSync(join(value.output, native.stdout), "utf8"));
  assert.equal(report.tests.length, 3, "the raw beskid test report is retained, including the non-required test");
  assert.equal(native.tests.length, 3, "row tests mirror the raw report, not the required subset");
  const host = feature.cases.find(row => row.id === "DEP06-02");
  assert.match(readFileSync(join(value.output, host.stderr), "utf8"), /beskid-installed-invocation sha256=[a-f0-9]{64} argv0=beskid/);
  assert.match(readFileSync(join(value.output, host.stdout), "utf8"), /^beskid-release-case begin test=fixture_DEP06_02_a$/m);
  assert.equal(host.command.argv[2], "{test_id}", "the row keeps the per-id template; the producer substitutes the libtest path per process");
  assert.match(readFileSync(join(value.output, host.stdout), "utf8"), new RegExp(`test ${libtestPath(value.manifest.cases.find(item => item.id === "DEP06-02").binding.source_file, "compiler/crates/beskid_tests_release", "fixture_DEP06_02_a")} \\.\\.\\. ok`));
  const expected = { version: VERSION, target: TARGET, source: SOURCE, case_manifest_sha256: ManifestDigest(value.manifestBytes), packet_root: value.output, packet_files,
    runtime_kit_sha256: value.buildResult.runtime_kit_sha256, runtime_abi_sha256: value.buildResult.runtime_abi_sha256,
    candidate_cli_sha256: packet_files["beskid-linux-amd64"], candidate_bundle_sha256: packet_files[`beskid-${VERSION}-${TARGET}.tar.gz`], installed_cli: value.buildResult.installed_cli };
  // The reader sees exactly the packet files; the platform assets are part of the closure too.
  const result = ValidateV06FeatureEvidence(feature, value.manifestBytes, expected);
  assert.equal(result.cases.length, 95);
  assert.deepEqual(result.provisional_cases.length, 15);
  const manifest = value.manifest;
  for (const name of [...manifest.packet_files, ...manifest.target_packet_files[TARGET]]) assert(names.includes(name), `${name} retained`);
});

test("a harness test without an installed invocation proof is not_executed and fails the producer", (t) => {
  const value = scenario({ proof: false });
  t.after(() => rmSync(value.root, { recursive: true, force: true }));
  assert.notEqual(value.run.status, 0);
  assert.match(value.run.stderr, /not_executed/);
  const feature = JSON.parse(readFileSync(join(value.output, "feature-evidence-v2.json"), "utf8"));
  const host = feature.cases.find(row => row.id === "DEP06-02");
  assert.equal(host.status, "failed");
  assert(host.tests.every(test => test.outcome === "not_executed"));
  assert(feature.cases.filter(row => row.id.startsWith("foundations.")).every(row => row.status === "success"), "native cells are unaffected");
});

test("the producer refuses an unfrozen manifest and a bundle without its own runtime kit", (t) => {
  const root = mkdtempSync(join(tmpdir(), "beskid-v06-producer-neg-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, "repo");
  mkdirSync(repo);
  const { manifestBytes, manifest, nativeTargets } = fixtureRepo(repo);
  const bundle = fakeBundle(root, nativeTargets);
  const harness = fakeHarnesses(root, manifest);
  const { output } = platformOutput(root, bundle);
  const unfrozen = join(root, "unfrozen.json");
  writeFileSync(unfrozen, CanonicalManifestBytes({ ...JSON.parse(manifestBytes.toString()), state: "binding_required" }));
  const refused = spawnSync(process.execPath, [producer, "linux", VERSION, output, bundle, "--harness-dir", harness, "--manifest", unfrozen, "--repo", repo], { encoding: "utf8" });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /not frozen/);
  rmSync(join(bundle, `lib/beskid-runtime/abi-5/${TARGET}/debug`), { recursive: true });
  const frozenPath = join(root, "frozen.json");
  writeFileSync(frozenPath, manifestBytes);
  const noKit = spawnSync(process.execPath, [producer, "linux", VERSION, output, bundle, "--harness-dir", harness, "--manifest", frozenPath, "--repo", repo], { encoding: "utf8" });
  assert.notEqual(noKit.status, 0);
  assert.match(noKit.stderr, /installed debug runtime ABI is missing/);
  const pipeline = spawnSync(process.execPath, [producer, "linux", VERSION, output, bundle, "--harness-dir", harness, "--manifest", frozenPath, "--repo", repo], { encoding: "utf8", env: { ...process.env, CI_PIPELINE_NUMBER: "7" } });
  assert.match(pipeline.stderr, /test-only and forbidden/);
});

#!/usr/bin/env node
// Freeze the 0.6 release case manifest from reviewed binding fragments.
//
// Usage: freeze-release-cases-v06.mjs [--check] [--manifest <path>] [--fragments <dir>] [--repo <root>]
//
// Each fragment under scripts/ci/release-case-bindings/ names, per case, the source file that declares
// its required assertions. This tool locates every declaration in the retained source bytes (byte
// offsets cannot be hand-written), archives declared inputs deterministically, writes the command
// templates of each execution kind and, when every case is bound, writes `state: "frozen"` in
// canonical JSON and prints the manifest digest to pin in woodpecker-release-evidence.mjs.
// `--check` validates the fragments against the sources without writing anything.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CORELIB_FINGERPRINT_FILE, CanonicalManifestBytes, EXECUTION_KINDS, InputArchive, InputSpec, HARNESS_LANGUAGES, INSTALLED_RECEIPT,
  ManifestDigest, ParseCanonicalManifest, RUNTIME_ABI_RECEIPT, RUNTIME_KIT_RECEIPT, caseLogName, caseStderrName, caseStdoutName,
  confinedRelativePath, fail, findDeclaration, fixturePacketName, harnessPacketName, inputPacketName, libtestPath, sha256, sourcePacketName,
} from "./release-case-common.mjs";

const scripts = dirname(fileURLToPath(import.meta.url));
const FRAGMENT_KEYS = ["execution", "target", "project", "harness", "source_file", "required_test_ids", "input", "fixture",
  "related_evidence", "profile_assertions", "obligation_assertions"];

function parseArguments(argv) {
  const options = { check: false, manifest: join(scripts, "release-cases-v06.json"), fragments: join(scripts, "release-case-bindings"), repo: resolve(scripts, "../..") };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--manifest", "--fragments", "--repo"].includes(argument)) options[argument.slice(2)] = resolve(argv[++index] ?? fail(`${argument} needs a value`));
    else fail(`unknown argument ${argument}`);
  }
  return options;
}

export function CommandTemplate(execution, binding) {
  const env = {};
  if (execution === "installed_host_harness") env.BESKID_V06_QUALIFIED_PREFIX = "{installed_prefix}";
  if (binding.input) env.BESKID_BSOL_CORPUS = `{input_root}/${binding.input.corpus}`;
  if (binding.fixture) env.BESKID_V06_RELEASE_FIXTURE = "{fixture}";
  if (execution === "installed_native") {
    return { argv: ["{installed_cli}", "test", "--plain", "--json", "--project", "{installed_corelib}/CoreLib.bws", "--target", binding.target, "--target-timeout", "900"],
      tool_file: "{installed_cli}", env };
  }
  return { argv: ["{harness}", "--exact", "{test_id}", "--test-threads=1", "--nocapture"], tool_file: "{harness}", env };
}

function validateAssertionList(list, keys, requiredIds, label) {
  if (list === undefined) return undefined;
  if (!Array.isArray(list) || !list.length) fail(`${label} must be a non-empty array`);
  for (const entry of list) {
    if (!entry || typeof entry !== "object" || Object.keys(entry).sort().join(",") !== [...keys].sort().join(",")) fail(`${label} entry has unexpected fields`);
    for (const key of keys) if (typeof entry[key] !== "string" || !entry[key]) fail(`${label} entry ${key} must be a string`);
    if (!requiredIds.includes(entry.test_id)) fail(`${label} names ${entry.test_id} outside required_test_ids`);
  }
  return list;
}

/** Resolve one fragment binding into a frozen binding against the checkout. */
export function ResolveBinding(id, item, fragment, manifest, repo) {
  if (!fragment || typeof fragment !== "object") fail(`${id} fragment must be an object`);
  for (const key of Object.keys(fragment)) if (!FRAGMENT_KEYS.includes(key)) fail(`${id} fragment has unknown field ${key}`);
  if (!EXECUTION_KINDS.includes(fragment.execution) || fragment.execution !== item.execution) fail(`${id} fragment execution kind differs from the manifest`);
  const language = HARNESS_LANGUAGES[fragment.execution];
  const ids = fragment.required_test_ids;
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some(value => typeof value !== "string")) fail(`${id} required_test_ids must be unique non-empty strings`);
  confinedRelativePath(fragment.source_file, `${id} source_file`);
  const sourcePath = join(repo, fragment.source_file);
  if (!existsSync(sourcePath)) fail(`${id} source ${fragment.source_file} is missing`);
  const source = readFileSync(sourcePath);
  const harness_source = { path: sourcePacketName(fragment.source_file), sha256: sha256(source) };
  const assertion_provenance = ids.map(test_id => {
    const matches = findDeclaration(language, source, test_id);
    if (matches.length !== 1) fail(`${id} declaration ${test_id} is ${matches.length === 0 ? "missing from" : "duplicated in"} ${fragment.source_file}`);
    return { test_id, source: harness_source, ...matches[0] };
  });
  let input = null;
  if (fragment.input !== null && fragment.input !== undefined) {
    const spec = InputSpec(fragment.input, `${id} input`);
    if (!existsSync(join(repo, spec.source_root))) fail(`${id} input ${spec.source_root} is missing`);
    input = { id: spec.id, path: inputPacketName(spec.id), sha256: sha256(InputArchive(repo, spec)), source_root: spec.source_root, include: spec.include, corpus: spec.corpus };
  }
  const fixture = fragment.fixture ?? null;
  if (fixture !== null && !manifest.fixture_executables?.[fixture]) fail(`${id} names undeclared fixture ${fixture}`);
  const binding = {
    harness_language: language, harness_source, source_file: fragment.source_file, required_test_ids: ids,
    command: CommandTemplate(fragment.execution, { ...fragment, input, fixture }), input, fixture, assertion_provenance,
    reviewed_source_binding: true, log: caseLogName(id),
  };
  if (fragment.execution === "installed_native") {
    if (typeof fragment.target !== "string" || !fragment.target || typeof fragment.project !== "string" || fragment.harness !== undefined) fail(`${id} native binding names exactly one target and project`);
    binding.target = fragment.target;
    binding.project = fragment.project;
  } else {
    if (typeof fragment.harness !== "string" || !manifest.harness_executables?.[fragment.harness] || fragment.target !== undefined) fail(`${id} host binding names exactly one declared harness`);
    binding.harness = fragment.harness;
    for (const testId of ids) libtestPath(fragment.source_file, manifest.harness_executables[fragment.harness].source_root, testId);
  }
  if (fragment.related_evidence !== undefined) {
    if (!Array.isArray(fragment.related_evidence) || !fragment.related_evidence.length) fail(`${id} related_evidence must be a non-empty array`);
    for (const related of fragment.related_evidence) {
      if (!related || typeof related.kind !== "string") fail(`${id} related_evidence entry needs a kind`);
      for (const testId of related.test_ids ?? []) if (ids.includes(testId)) fail(`${id} requires library-level ${testId} listed as related evidence`);
    }
    binding.related_evidence = fragment.related_evidence;
  }
  const profile = validateAssertionList(fragment.profile_assertions, ["representation", "implementation", "direction", "test_id"], ids, `${id} profile_assertions`);
  if (profile) binding.profile_assertions = profile;
  const obligation = validateAssertionList(fragment.obligation_assertions, ["kind", "obligation", "test_id"], ids, `${id} obligation_assertions`);
  if (obligation) binding.obligation_assertions = obligation;
  return binding;
}

export function FreezeManifest(manifestBytes, fragments, repo, { check = false } = {}) {
  const manifest = ParseCanonicalManifest(manifestBytes);
  if (manifest.schema_version !== 2) fail("manifest schema_version must be 2");
  const provisional = new Set((manifest.provisional_cases ?? []).map(item => item.id));
  const cases = new Map(manifest.cases.map(item => [item.id, item]));
  const bound = new Map();
  const sourceNames = new Map();
  for (const [name, fragment] of fragments) {
    if (fragment?.schema_version !== 1 || typeof fragment.slice !== "string" || !fragment.cases || typeof fragment.cases !== "object") fail(`${name} is not a schema-1 binding fragment`);
    for (const [id, entry] of Object.entries(fragment.cases)) {
      if (provisional.has(id)) fail(`${name} binds provisional case ${id}`);
      const item = cases.get(id);
      if (!item) fail(`${name} binds unknown case ${id}`);
      if (bound.has(id)) fail(`${id} is bound by ${bound.get(id).fragment} and ${name}`);
      const binding = ResolveBinding(id, item, entry, manifest, repo);
      const owner = sourceNames.get(binding.harness_source.path);
      if (owner && owner !== binding.source_file) fail(`packet name ${binding.harness_source.path} collides between ${owner} and ${binding.source_file}`);
      sourceNames.set(binding.harness_source.path, binding.source_file);
      if (item.binding && item.binding.target && (item.binding.target !== binding.target
          || JSON.stringify(item.binding.required_test_ids) !== JSON.stringify(binding.required_test_ids))) fail(`${id} fragment disagrees with the manifest's reviewed target or ids`);
      bound.set(id, { fragment: name, binding });
    }
  }
  const inputRoots = new Map();
  for (const { binding } of bound.values()) {
    if (!binding.input) continue;
    const shape = JSON.stringify([binding.input.source_root, binding.input.include, binding.input.corpus]);
    const known = inputRoots.get(binding.input.id);
    if (known && known !== shape) fail(`input ${binding.input.id} names two source shapes: ${known} and ${shape}`);
    inputRoots.set(binding.input.id, shape);
  }
  const unbound = [...cases.keys()].filter(id => !bound.has(id));
  const summary = { bound: bound.size, unbound, cases: cases.size, provisional: provisional.size };
  if (check) return { summary, manifest: null, bytes: null, digest: null };
  if (unbound.length) fail(`cannot freeze: ${unbound.length} unbound cases (${unbound.slice(0, 8).join(", ")}${unbound.length > 8 ? ", ..." : ""})`);
  const packetFiles = new Set([INSTALLED_RECEIPT, RUNTIME_KIT_RECEIPT, RUNTIME_ABI_RECEIPT, CORELIB_FINGERPRINT_FILE]);
  for (const item of manifest.cases) {
    item.binding = bound.get(item.id).binding;
    packetFiles.add(item.binding.harness_source.path);
    if (item.binding.input) packetFiles.add(item.binding.input.path);
    packetFiles.add(caseLogName(item.id)); packetFiles.add(caseStdoutName(item.id)); packetFiles.add(caseStderrName(item.id));
  }
  manifest.packet_files = [...packetFiles].sort();
  manifest.target_packet_files = Object.fromEntries(manifest.targets.map(target => [target, [
    ...Object.keys(manifest.harness_executables ?? {}).map(name => harnessPacketName(name, target)),
    ...Object.keys(manifest.fixture_executables ?? {}).map(name => fixturePacketName(name, target)),
  ].sort()]));
  manifest.state = "frozen";
  const bytes = CanonicalManifestBytes(manifest);
  return { summary, manifest, bytes, digest: ManifestDigest(bytes) };
}

export function LoadFragments(directory) {
  return readdirSync(directory).filter(name => name.endsWith(".json")).sort()
    .map(name => [name, JSON.parse(readFileSync(join(directory, name), "utf8"))]);
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const result = FreezeManifest(readFileSync(options.manifest), LoadFragments(options.fragments), options.repo, { check: options.check });
    if (options.check) {
      process.stdout.write(`${JSON.stringify(result.summary)}\n`);
    } else {
      writeFileSync(options.manifest, result.bytes);
      process.stdout.write(`${JSON.stringify({ ...result.summary, state: "frozen", case_manifest_sha256: result.digest })}\n`);
    }
  } catch (error) {
    process.stderr.write(`freeze release cases: ${error.message}\n`);
    process.exit(1);
  }
}

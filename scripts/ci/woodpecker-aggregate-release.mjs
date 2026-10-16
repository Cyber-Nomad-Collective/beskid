#!/usr/bin/env node
// Local, non-publishing fan-in. Evidence must come from trusted workers.
// Integrity checking is not authentication; never accept arbitrary uploaded evidence.
import { copyFileSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scripts = dirname(fileURLToPath(import.meta.url));
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { encoding: "utf8", env });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `${command} failed`);
  return result.stdout;
}
function json(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
}
const PLATFORMS = ["linux", "macos", "windows"];
// Each platform is validated against its own handoff source: per-platform sources may differ in
// non-build root paths only (release-user-observation.mjs --platform-sources). The compiler commit and
// version are shared; the release source identity is the candidate.
function validate(path, candidate, sources) {
  const parts = PLATFORMS.map(platform => JSON.parse(run(process.execPath, [join(scripts, "woodpecker-release-evidence.mjs"), path, platform])));
  const [first] = parts;
  for (const [index, part] of parts.entries()) {
    const platform = PLATFORMS[index];
    if (part.schema_version !== 1 || part.platforms.length !== 1 || part.platforms[0].platform !== platform) throw new Error(`${platform} evidence is malformed`);
    if (part.version !== first.version || part.source.compiler_commit !== first.source.compiler_commit) throw new Error(`${platform} evidence version or compiler differs from linux`);
    if (part.source.superrepo_commit !== sources[platform]) throw new Error(`${platform} evidence is not the build of its handoff source ${sources[platform]}`);
  }
  return {
    schema_version: 1, version: first.version,
    source: { superrepo_commit: candidate, compiler_commit: first.source.compiler_commit },
    platform_sources: { ...sources },
    platforms: parts.map(part => part.platforms[0]),
  };
}
function readSources(path) {
  const sources = JSON.parse(readFileSync(path, "utf8"));
  if (!sources || JSON.stringify(Object.keys(sources).sort()) !== JSON.stringify(PLATFORMS) || PLATFORMS.some(role => !/^[0-9a-f]{40}$/.test(sources[role]))) {
    throw new Error("platform sources must name a 40-character commit for linux, macos and windows");
  }
  return sources;
}
function copyGateEvidence(from, to) {
  for (const component of ["compiler", "corelib"]) {
    for (const suffix of ["json", "log"]) {
      const name = `release-gate-${component}.${suffix}`;
      const source = join(from, name);
      const stat = lstatSync(source);
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`invalid release gate artifact: ${name}`);
      copyFileSync(source, join(to, name));
    }
  }
}

// The per-platform build handoffs the evidence was collected from. Each platform is built by its own
// pipeline, so validated-evidence.json records each platform's pipeline number and the digest of its
// verified UPLOAD_SHA256SUMS, all bound to the one release source.
function readHandoffs(path, version, sources, compiler) {
  const handoffs = JSON.parse(readFileSync(path, "utf8"));
  const platforms = ["linux", "macos", "windows"];
  if (!handoffs || Array.isArray(handoffs) || typeof handoffs !== "object" || JSON.stringify(Object.keys(handoffs).sort()) !== JSON.stringify(platforms)) {
    throw new Error("handoff record must name exactly the linux, macos and windows builds");
  }
  return Object.fromEntries(platforms.map(platform => {
    const item = handoffs[platform];
    // A repackaged handoff keeps the build pipeline and source and names the pipeline and root commit
    // that packaged its installers.
    const keys = ["compiler", "pipeline", "role", "source", "upload_sha256sums_sha256", "version"];
    const repackaged = item && Object.hasOwn(item, "packaged_by");
    // A superseding repackage also names the packaging it superseded (woodpecker-handoff.mjs).
    const superseding = repackaged && Object.hasOwn(item, "supersedes");
    const expected = repackaged ? [...keys, "packaged_by", "packaged_by_commit", ...(superseding ? ["supersedes", "supersedes_commit"] : [])].sort() : keys;
    if (!item || JSON.stringify(Object.keys(item).sort()) !== JSON.stringify(expected) || item.role !== platform
      || item.source !== sources[platform] || item.compiler !== compiler || item.version !== version
      || !Number.isSafeInteger(item.pipeline) || item.pipeline < 1 || !/^[0-9a-f]{64}$/.test(item.upload_sha256sums_sha256)
      || (repackaged && (!Number.isSafeInteger(item.packaged_by) || item.packaged_by < 1 || !/^[0-9a-f]{40}$/.test(item.packaged_by_commit)))
      || (superseding && (!Number.isSafeInteger(item.supersedes) || item.supersedes < item.pipeline || item.supersedes >= item.packaged_by || !/^[0-9a-f]{40}$/.test(item.supersedes_commit)))) {
      throw new Error(`${platform} handoff record does not match the requested release source/version`);
    }
    const packaged = repackaged ? { packaged_by: item.packaged_by, packaged_by_commit: item.packaged_by_commit, ...(superseding ? { supersedes: item.supersedes, supersedes_commit: item.supersedes_commit } : {}) } : {};
    return [platform, { pipeline: item.pipeline, source: item.source, upload_sha256sums_sha256: item.upload_sha256sums_sha256, ...packaged }];
  }));
}

try {
  if (process.argv.length !== 9) throw new Error("usage: woodpecker-aggregate-release.mjs <evidence-dir> <new-output-dir> <version> <candidate-sha> <compiler-sha> <handoffs.json> <platform-sources.json>");
  const [inputArg, outputArg, version, superrepo, compiler, handoffsArg, sourcesArg] = process.argv.slice(2);
  const sources = readSources(resolve(sourcesArg));
  // The release source identity is the candidate, and the candidate must itself be a built source.
  if (!Object.values(sources).includes(superrepo)) throw new Error("no platform build matches the requested release source/version");
  const handoffs = readHandoffs(resolve(handoffsArg), version, sources, compiler);
  const input = resolve(inputArg);
  const output = resolve(outputArg);
  const evidence = validate(input, superrepo, sources);
  if (evidence.version !== version || evidence.source.superrepo_commit !== superrepo || evidence.source.compiler_commit !== compiler) {
    throw new Error("evidence does not match the requested release source/version");
  }
  // Exclusive creation is the transaction lock. Interrupted transactions remain
  // inspectable and are never silently reused or overwritten.
  mkdirSync(output, { mode: 0o700 });
  const snapshot = join(output, "evidence");
  mkdirSync(snapshot);
  for (const platform of evidence.platforms) {
    mkdirSync(join(snapshot, platform.platform));
    for (const name of [...platform.artifacts.map(asset => asset.name), "SHA256SUMS"]) {
      copyFileSync(join(input, platform.platform, name), join(snapshot, platform.platform, name));
    }
  }
  copyGateEvidence(join(input, "linux"), join(snapshot, "linux"));
  // Recheck the private snapshot so concurrent input changes cannot be promoted.
  const checked = validate(snapshot, superrepo, sources);
  if (JSON.stringify(checked) !== JSON.stringify(evidence)) throw new Error("evidence changed while snapshotting");
  json(join(output, "validated-evidence.json"), { ...checked, handoffs });
  const assets = join(output, "assets");
  mkdirSync(assets);
  const reports = join(output, "gate-reports");
  mkdirSync(reports);
  mkdirSync(join(reports, "stages"));
  for (const component of ["compiler", "corelib"]) {
    copyFileSync(join(snapshot, "linux", `release-gate-${component}.json`), join(reports, "stages", `${component}.json`));
    copyFileSync(join(snapshot, "linux", `release-gate-${component}.log`), join(reports, `release-gate-${component}.log`));
  }
  for (const [index, platform] of checked.platforms.entries()) {
    json(join(reports, "stages", `${index}.json`), {
      component: platform.platform, stage: "native-build", platform: platform.target, status: "success",
      command: null, raw_log: `evidence/${platform.platform}/platform-result-${platform.target}.json`,
    });
  }
  const results = [];
  const bundles = [];
  for (const platform of checked.platforms) {
    results.push(join(snapshot, platform.platform, `platform-result-${platform.target}.json`));
    // Only the CLI, LSP and bundle are publishable assets; retained evidence (schema-2 packet files,
    // harness executables, logs) stays in the evidence snapshot.
    for (const artifact of platform.artifacts.filter(asset => platform.release_assets.includes(asset.name))) {
      copyFileSync(join(snapshot, platform.platform, artifact.name), join(assets, artifact.name));
      if (artifact.name.endsWith(".tar.gz")) bundles.push(`${platform.target}|https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/v${version}/${artifact.name}|${artifact.sha256}`);
    }
  }
  run("bash", [join(scripts, "build-beskid-release-manifest.sh"), version, compiler, join(assets, "beskid-release.json"), ...bundles]);
  // Canonical state builder consumes the three verified native build results. State is emitted only after snapshot validation.
  run("bash", [join(scripts, "build-release-state.sh"), "stable", version, compiler, superrepo, "success", join(output, "release-state.json"), ...results],
    // The release gates ran in the Linux build, so their reports carry the Linux handoff source.
    { ...process.env, GATE_REPORT_DIR: reports, HANDOFF_RELEASE_URL: "", GATE_SUPERREPO_SHA: sources.linux });
  const state = JSON.parse(readFileSync(join(output, "release-state.json"), "utf8"));
  if (!state.publishable) throw new Error("aggregate is not publishable");
  const linux = checked.platforms.find(platform => platform.platform === "linux");
  const receipt = JSON.parse(readFileSync(join(snapshot, "linux", "cli-surface-receipt-v1.json"), "utf8"));
  const receiptArtifact = linux.artifacts.find(artifact => artifact.name === "cli-surface-receipt-v1.json");
  state.cli_surface = {
    status: "success", receipt: receiptArtifact.name, receipt_sha256: receiptArtifact.sha256,
    evidence: receipt.evidence, evidence_sha256: receipt.evidence_sha256,
    binary: receipt.binary, binary_sha256: receipt.binary_sha256,
    runtime_kit_sha256: receipt.runtime_kit_sha256,
    corelib_fingerprint: receipt.corelib_fingerprint,
    source: receipt.source, counts: receipt.counts,
  };
  writeFileSync(join(output, "release-state.json"), `${JSON.stringify(state, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output, version, source: checked.source, published: false })}\n`);
} catch (error) {
  process.stderr.write(`release aggregation: ${error.message}\n`);
  process.exit(1);
}

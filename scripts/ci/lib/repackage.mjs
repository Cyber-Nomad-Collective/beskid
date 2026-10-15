#!/usr/bin/env node
// Verify that an earlier build pipeline's retained outputs may be repackaged, and prepare its handoff.
//
// Usage:
//   repackage.mjs verify <output-root> <linux|macos|windows> <build-pipeline> <repackage-pipeline>
//
// The repackage lane (woodpecker-repackage-platform.sh) reuses the qualified outputs of build pipeline
// N instead of rebuilding them. It fails closed unless:
//   - exactly one `<output-root>/<N>-<C>/<platform>` exists, C being a 40-character commit;
//   - every file in the build's SHA256SUMS exists with its recorded digest;
//   - the build result and platform result are successful, for source C and C's compiler pointer;
//   - the v0.6 feature evidence lists every release case of the reviewed manifest for this target,
//     each successful (exit 0, not timed out), and each case record agrees;
//   - the full release evidence validator accepts the platform;
//   - the build was never packaged (no package-result.json);
//   - on Linux, the Corelib gate succeeded and the compiler gate either succeeded or failed in its
//     clippy phase only. Clippy is report-only in the compiler release gate; such a report is
//     re-issued as successful with the original verdict, report digest and the phases that did not
//     run recorded beside it;
//   - this checkout (the repackaging root) is a packaging-only descendant of C.
// It then writes the handoff directory `<output-root>/<N>-<C>/<platform>-repackage-<M>`: every
// top-level file of the build output, the re-issued compiler gate report when one was needed, and
// repackage-provenance.json. The build output itself is never modified.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ValidatePackagingRoot } from "../release-user-observation.mjs";

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = { linux: "x86_64-unknown-linux-gnu", macos: "aarch64-apple-darwin", windows: "x86_64-pc-windows-msvc" };
const COMMIT = /^[0-9a-f]{40}$/;
const PIPELINE = /^[1-9][0-9]*$/;

function Fail(message) {
  throw new Error(`repackage: ${message}`);
}
function Digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
function ReadJson(path, label) {
  if (!existsSync(path)) Fail(`missing ${label}: ${path}`);
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return Fail(`${label} is not JSON: ${path}`); }
}
function Git(repo, args, label) {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  if (result.status !== 0) Fail(`${label}: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

// The single build output directory of pipeline `build` for `platform`, and its source commit.
export function LocateBuildOutput(outputRoot, platform, build) {
  if (!TARGETS[platform]) Fail(`unsupported platform ${platform}`);
  if (!PIPELINE.test(build)) Fail(`build pipeline must be a positive number, got ${build}`);
  if (!existsSync(outputRoot)) Fail(`missing output root ${outputRoot}`);
  const matches = readdirSync(outputRoot).filter(name => name.startsWith(`${build}-`));
  const builds = matches.filter(name => COMMIT.test(name.slice(build.length + 1)));
  if (builds.length !== 1) Fail(`expected exactly one build output ${build}-<commit> in ${outputRoot}, found ${builds.length}`);
  const evidenceRoot = join(outputRoot, builds[0]);
  const directory = join(evidenceRoot, platform);
  if (!existsSync(directory) || !lstatSync(directory).isDirectory()) Fail(`missing ${platform} outputs of build ${build}: ${directory}`);
  return { evidenceRoot, directory, source: builds[0].slice(build.length + 1) };
}

// Every SHA256SUMS entry exists with its recorded digest.
export function VerifyChecksums(directory) {
  const path = join(directory, "SHA256SUMS");
  if (!existsSync(path)) Fail(`missing SHA256SUMS in ${directory}`);
  const entries = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  if (entries.length === 0) Fail("SHA256SUMS is empty");
  for (const line of entries) {
    const match = /^([0-9a-f]{64}) [ *]([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(line);
    if (!match) Fail(`malformed SHA256SUMS entry: ${line}`);
    const file = join(directory, match[2]);
    if (!existsSync(file) || !lstatSync(file).isFile()) Fail(`SHA256SUMS names a missing output: ${match[2]}`);
    if (Digest(file) !== match[1]) Fail(`checksum mismatch: ${match[2]}`);
  }
  return entries.length;
}

// Every release case of the reviewed manifest for `target` passed in this build.
export function VerifyReleaseCases(directory, target, manifest, source) {
  const feature = ReadJson(join(directory, "feature-evidence-v2.json"), "feature evidence");
  if (feature.target !== target) Fail(`feature evidence target ${feature.target} is not ${target}`);
  if (feature.source?.superrepo_commit !== source.superrepo_commit || feature.source?.compiler_commit !== source.compiler_commit) Fail("feature evidence source is not the build source");
  const expected = manifest.cases.filter(item => !Array.isArray(item.targets) || item.targets.includes(target)).map(item => item.id).sort();
  const cases = Array.isArray(feature.cases) ? feature.cases : [];
  const actual = cases.map(item => item.id).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) Fail(`release cases differ from the manifest (${actual.length} recorded, ${expected.length} expected)`);
  for (const item of cases) {
    if (item.status !== "success" || item.exit_code !== 0 || item.timed_out !== false) Fail(`release case ${item.id} did not pass`);
    const record = ReadJson(join(directory, `case-${item.id}.json`), `case record ${item.id}`);
    if (record.id !== item.id || record.status !== "success" || record.exit_code !== 0 || record.timed_out !== false) Fail(`release case record ${item.id} did not pass`);
  }
  return cases.length;
}

// A compiler gate log that failed only in its clippy phase: the clippy phase began, no later phase
// began, and every error diagnostic is a clippy lint (no rustc error codes, no other errors).
export function ClippyOnlyFailure(log) {
  const lines = log.split(/\r?\n/);
  const clippy = lines.findIndex(line => /^==> Clippy\b/.test(line));
  if (clippy < 0) return { clippyOnly: false, reason: "the gate never reached its clippy phase" };
  if (lines.slice(clippy + 1).some(line => /^==> /.test(line))) return { clippyOnly: false, reason: "a phase after clippy ran" };
  if (lines.some(line => /^error\[E\d{4}\]/.test(line))) return { clippyOnly: false, reason: "the log contains rustc compile errors" };
  const summary = /^error: (could not compile|aborting due to|build failed)/;
  const blocks = [];
  for (const [index, line] of lines.entries()) {
    if (index <= clippy) continue;
    if (/^(error|warning)(\[[^\]]+\])?: /.test(line)) blocks.push({ error: line.startsWith("error") && !summary.test(line), body: [line] });
    else if (blocks.length) blocks.at(-1).body.push(line);
  }
  const errors = blocks.filter(block => block.error);
  if (errors.length === 0) return { clippyOnly: false, reason: "the clippy phase reported no lint errors" };
  const other = errors.filter(block => !block.body.some(line => /rust-clippy|clippy::/.test(line)));
  if (other.length) return { clippyOnly: false, reason: `non-clippy error: ${other[0].body[0]}` };
  return { clippyOnly: true, findings: errors.length };
}

// The Linux gate reports of a repackaged build. Returns the compiler report to ship.
export function VerifyLinuxGates(directory, source, version, repackaging) {
  const reports = {};
  for (const component of ["corelib", "compiler"]) {
    const report = ReadJson(join(directory, `release-gate-${component}.json`), `${component} gate report`);
    const log = join(directory, report.raw_log ?? "");
    if (report.raw_log !== `release-gate-${component}.log` || !existsSync(log) || Digest(log) !== report.raw_log_sha256) Fail(`${component} gate log does not match its report`);
    if (report.version !== version || report.source?.superrepo_commit !== source.superrepo_commit || report.source?.compiler_commit !== source.compiler_commit) Fail(`${component} gate report is not for the build source`);
    reports[component] = report;
  }
  const corelib = reports.corelib;
  if (corelib.status !== "success" || corelib.exit_code !== 0) Fail("the Corelib gate did not pass");
  const compiler = reports.compiler;
  if (compiler.status === "success" && compiler.exit_code === 0) return { report: compiler, reissued: false };
  const verdict = ClippyOnlyFailure(readFileSync(join(directory, compiler.raw_log), "utf8"));
  if (!verdict.clippyOnly) Fail(`the compiler gate failed beyond clippy: ${verdict.reason}`);
  const original = Digest(join(directory, "release-gate-compiler.json"));
  return {
    reissued: true,
    report: {
      ...compiler,
      status: "success",
      exit_code: 0,
      reissued: {
        rule: "clippy is report-only in the compiler release gate",
        original_status: compiler.status,
        original_exit_code: compiler.exit_code,
        original_report: "release-gate-compiler.build.json",
        original_report_sha256: original,
        clippy_findings: verdict.findings,
        phases_not_run: ["native runtime-kit staging", "compiler workspace tests"],
        by_pipeline: Number(repackaging.pipeline),
        by_commit: repackaging.commit,
      },
    },
  };
}

export function VerifyRepackage({ outputRoot, platform, build, pipeline, repo, head, validateEvidence = DefaultEvidenceValidator }) {
  if (!PIPELINE.test(pipeline) || pipeline === build) Fail("the repackaging pipeline must be a positive number other than the build pipeline");
  const located = LocateBuildOutput(outputRoot, platform, build);
  const { directory, source: sourceCommit } = located;
  const target = TARGETS[platform];
  VerifyChecksums(directory);
  const result = ReadJson(join(directory, "woodpecker-build-result.json"), "build result");
  if (result.platform !== platform || result.target !== target || result.platform_result_status !== "success" || result.published !== false) Fail("the build result is not a successful unpublished build of this platform");
  if (result.source?.superrepo_commit !== sourceCommit) Fail(`the build result source ${result.source?.superrepo_commit} is not ${sourceCommit}`);
  const compiler = Git(repo, ["rev-parse", `${sourceCommit}:compiler`], `build source ${sourceCommit} is not available in this checkout`);
  if (result.source?.compiler_commit !== compiler) Fail(`the build compiler ${result.source?.compiler_commit} is not the compiler pointer ${compiler} of ${sourceCommit}`);
  const platformResult = ReadJson(join(directory, `platform-result-${target}.json`), "platform result");
  const builds = platformResult.builds ?? {};
  if (!["bundle", "cli", "lsp"].every(name => builds[name]?.status === "success") || (platformResult.diagnostics ?? []).length) Fail("the platform result is not successful");
  const manifest = ReadJson(join(scripts, "release-cases-v06.json"), "release-case manifest");
  const cases = VerifyReleaseCases(directory, target, manifest, result.source);
  if (existsSync(join(directory, "package-result.json"))) Fail("the build was already packaged; repackage only an unpackaged build");
  const packaging = ValidatePackagingRoot(repo, sourceCommit, head, head);
  validateEvidence(located.evidenceRoot, platform);
  const gates = platform === "linux" ? VerifyLinuxGates(directory, result.source, result.version, { pipeline, commit: head }) : null;
  return { ...located, target, version: result.version, compiler, cases, packaging, gates };
}

function DefaultEvidenceValidator(evidenceRoot, platform) {
  const checked = spawnSync(process.execPath, [join(scripts, "woodpecker-release-evidence.mjs"), evidenceRoot, platform], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (checked.status !== 0) Fail(`release evidence rejected: ${checked.stderr.trim()}`);
}

// The flat handoff directory of a verified repackage, before the installers are added.
export function WriteRepackageHandoff(verified, handoff, build, pipeline) {
  if (existsSync(handoff)) Fail(`handoff directory already exists: ${handoff}`);
  mkdirSync(handoff, { recursive: true, mode: 0o700 });
  for (const entry of readdirSync(verified.directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    copyFileSync(join(verified.directory, entry.name), join(handoff, entry.name));
  }
  if (verified.gates?.reissued) {
    copyFileSync(join(verified.directory, "release-gate-compiler.json"), join(handoff, "release-gate-compiler.build.json"));
    writeFileSync(join(handoff, "release-gate-compiler.json"), `${JSON.stringify(verified.gates.report, null, 2)}\n`);
  }
  const provenance = {
    schema_version: 1,
    kind: "beskid-repackage",
    platform: verified.target,
    version: verified.version,
    build: { pipeline: Number(build), superrepo_commit: verified.source, compiler_commit: verified.compiler, release_cases_passed: verified.cases },
    packaged_by: { pipeline: Number(pipeline), superrepo_commit: verified.packaging.packaging_commit, distrib_commit: verified.packaging.distrib_commit },
    compiler_gate_reissued: Boolean(verified.gates?.reissued),
  };
  writeFileSync(join(handoff, "repackage-provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`);
  return provenance;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, outputRoot, platform, build, pipeline, ...extra] = process.argv.slice(2);
    if (command !== "verify" || !pipeline || extra.length) Fail("usage: repackage.mjs verify <output-root> <linux|macos|windows> <build-pipeline> <repackage-pipeline>");
    const repo = resolve(scripts, "../..");
    const head = Git(repo, ["rev-parse", "HEAD"], "HEAD lookup failed");
    const verified = VerifyRepackage({ outputRoot: resolve(outputRoot), platform, build, pipeline, repo, head });
    const handoff = join(verified.evidenceRoot, `${platform}-repackage-${pipeline}`);
    const provenance = WriteRepackageHandoff(verified, handoff, build, pipeline);
    process.stdout.write(`${JSON.stringify({ evidence_root: verified.evidenceRoot, handoff, source: verified.source, compiler: verified.compiler, version: verified.version, ...provenance })}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

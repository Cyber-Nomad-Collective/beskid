#!/usr/bin/env node
// Resolve the release candidate and report the CLI06-06 uncoached-observation record of one release.
//
// Usage:
//   release-user-observation.mjs <record.json> <version> <candidate-superrepo-sha> <compiler-sha> <validated-evidence.json>
//   release-user-observation.mjs --source <repo> <version> <head-sha> [<candidate-sha>]
//   release-user-observation.mjs --platform-sources <repo> <version> <head-sha> <candidate|''> <linux|''> <macos|''> <windows|''>
//   release-user-observation.mjs --packaging-root <repo> <source-sha> <packaging-sha> <head-sha>
//   release-user-observation.mjs --release <repo> <version> <head-sha> <candidate-sha> <compiler-sha> <validated-evidence.json>
//
// Candidate rule. The release runs on HEAD and publishes the per-platform builds of one candidate C.
// C is the `superrepo_commit` of the record committed at docs/release/cli06-06-record-v<version>.json,
// else the gate input (BESKID_RELEASE_CANDIDATE, passed as <candidate-sha>), else HEAD. When the record
// and the input both name a candidate they must agree. C must be HEAD or an ancestor of HEAD, and HEAD's
// `compiler` and `beskid_bsol` gitlinks and release-case manifest digest must equal C's: everything
// that determines the artifacts is identical, so root-only commits after C (CI scripts, docs, the record)
// never force a rebuild. `--source` prints C.
//
// CLI06-06 is a published, non-blocking quality target until Beskid has real users. `--release` prints
// an observation report with status `pass`, `below-threshold` or `not-performed` and exits 0 for all
// three. A committed record is still validated strictly: an invalid or forged record (shape, candidate
// identity, CLI digests, handout digest, transcripts) exits 1 and blocks the release.
//
// Participants see the installed CLI, its help and the language-rules handout of the kit, nothing
// else. Each participant declares `materials: "cli-help+language-rules"` and the sha256 of the
// handout shown; the digest must equal the committed handout.
//
// The record is observer-attested: the validator checks shape, per-participant transcripts (each must
// include `beskid --version` printing the candidate version) and that the recorded candidate CLI digests
// are the validated aggregate's own CLI artifacts. It cannot prove that five people existed or were
// uncoached; `verification: "observer-attested"` says so in the release state.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseExactReleaseVersion } from "./release-version.mjs";

const TARGETS = ["x86_64-unknown-linux-gnu", "aarch64-apple-darwin", "x86_64-pc-windows-msvc"];
const COMMIT = /^[0-9a-f]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const MATERIALS = "cli-help+language-rules";
export const LANGUAGE_RULES_PATH = "docs/release/cli06-06-usability-check/language-rules.md";
const LANGUAGE_RULES_FILE = fileURLToPath(new URL(`../../${LANGUAGE_RULES_PATH}`, import.meta.url));
const RECORD_KEYS = ["schema_version", "kind", "verification", "version", "superrepo_commit", "compiler_commit", "candidate_cli_sha256", "recorded_utc", "observer", "participants"];
const PARTICIPANT_KEYS = ["id", "target", "materials", "language_rules_sha256", "add_found_seconds", "journey_completed", "journey_seconds", "transcript", "failures"];
const ENTRY_KEYS = ["utc", "command", "exit_code", "output"];
const THRESHOLD = 4;
export const CASE_MANIFEST_PATH = "scripts/ci/release-cases-v06.json";
// Build identity: the gitlinks the platform builds consume (Corelib is a gitlink inside the compiler
// commit, so the compiler pointer fixes it) plus the release-case manifest digest.
export const BUILD_GITLINKS = ["compiler", "beskid_bsol"];
// Packaging identity: beskid_distrib turns a qualified build into native installers and is read by no
// build step. Each package-result names the distrib commit of the root commit that packaged it: the
// build's own source, or the repackaging root of a repackaged handoff (ValidatePackagingRoot).
export const PACKAGING_GITLINK = "beskid_distrib";
// Root paths that no platform build step reads. Per-platform handoff sources may differ from the
// candidate only in these paths; every other path (build and packaging scripts, the per-platform
// workflows, the evidence validator and handoff uploader the build runs) must be identical.
export const NON_BUILD_PATHS = [
  /^openspec\//, /^docs\//, /^CHANGELOG\.md$/,
  // Website content (site/website, site/auth, site/learn): built into site images, never into a compiler,
  // Corelib or installer artifact.
  /^site\//,
  /^\.woodpecker\/release\.yml$/, /^\.woodpecker\/pckg\.yml$/,
  /^scripts\/ci\/test\//,
  // Gate and check scripts: they write gate reports, never artifacts.
  /^scripts\/ci\/compiler-rust-gate\.sh$/, /^scripts\/ci\/woodpecker-release-gates\.sh$/,
  // CLI06-06 validator, release collector and publisher scripts: they run after the builds.
  /^scripts\/ci\/release-user-observation\.mjs$/, /^scripts\/ci\/woodpecker-release\.sh$/,
  /^scripts\/ci\/woodpecker-fetch-handoffs\.sh$/, /^scripts\/ci\/woodpecker-aggregate-release\.mjs$/,
  /^scripts\/ci\/build-release-state\.sh$/, /^scripts\/ci\/render-compiler-release-notes\.sh$/,
  /^scripts\/ci\/publish-release-stream\.sh$/, /^scripts\/ci\/publish-homebrew-formula\.sh$/,
  // Corelib registry publisher: runs after a release, from the published bundle.
  /^scripts\/ci\/corelib-publish\.sh$/, /^scripts\/ci\/lib\/corelib-publish-runner\.mjs$/,
];
// Root paths a repackaging root may change relative to the build source it packages, in addition to
// NON_BUILD_PATHS: the native packaging scripts and the distribution submodule. A repackaged handoff
// keeps the build's artifacts, evidence and source identity; only its installers are produced by
// these newer packaging inputs, and its UPLOAD_COMPLETE and package-result name the repackaging
// pipeline and root commit.
export const REPACKAGE_ALLOWED_PATHS = [
  /^beskid_distrib$/,
  /^\.woodpecker\/repackage-(linux|macos|windows)\.yml$/,
  /^scripts\/ci\/woodpecker-package-platform\.mjs$/, /^scripts\/ci\/lib\/bundle-caches\.mjs$/,
  /^scripts\/ci\/lib\/repackage\.mjs$/, /^scripts\/ci\/lib\/packet-evidence\.mjs$/, /^scripts\/ci\/woodpecker-repackage-platform\.sh$/,
  /^scripts\/ci\/woodpecker-repackage-windows\.sh$/,
  /^scripts\/ci\/woodpecker-upload-handoff\.sh$/, /^scripts\/ci\/woodpecker-handoff\.mjs$/,
];
const PLATFORM_ROLES = ["linux", "macos", "windows"];

export function RecordPath(version) {
  parseExactReleaseVersion(version);
  return `docs/release/cli06-06-record-v${version}.json`;
}
export function LanguageRulesDigest(file = LANGUAGE_RULES_FILE) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function Fail(message) {
  throw new Error(`CLI06-06 user observation: ${message}`);
}
function exactKeys(value, keys, label) {
  if (!value || Array.isArray(value) || typeof value !== "object" || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) Fail(`${label} has unexpected fields`);
}
function utc(value, label) {
  if (typeof value !== "string" || !UTC.test(value) || Number.isNaN(Date.parse(value))) Fail(`${label} is not a UTC timestamp`);
}
function seconds(value, label) {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0) Fail(`${label} must be null or a non-negative integer`);
  return value;
}
function text(value, label, { max = 4096 } = {}) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) Fail(`${label} must be printable text`);
  return value;
}
function identity(record, version, superrepo, compiler) {
  parseExactReleaseVersion(version);
  if (!COMMIT.test(superrepo) || !COMMIT.test(compiler)) Fail("release identity must name two 40-character commits");
  if (record.version !== version || record.superrepo_commit !== superrepo || record.compiler_commit !== compiler) Fail("release identity mismatch");
}
function candidateDigests(evidence) {
  if (!evidence || !Array.isArray(evidence.platforms)) Fail("validated evidence has no platforms");
  const digests = {};
  for (const platform of evidence.platforms) {
    const cli = platform.artifacts?.find(artifact => artifact.name === platform.release_assets?.[0]);
    if (!cli || !SHA256.test(cli.sha256)) Fail(`validated evidence lacks the ${platform.target} CLI digest`);
    digests[platform.target] = cli.sha256;
  }
  return digests;
}

export function ValidateObservation(record, version, superrepo, compiler, evidence, languageRules = LanguageRulesDigest()) {
  if (!record || Array.isArray(record) || typeof record !== "object") Fail("record must be an object");
  exactKeys(record, RECORD_KEYS, "record");
  if (record.schema_version !== 1 || record.kind !== "cli06-06-uncoached-observation" || record.verification !== "observer-attested") Fail("record kind or verification mismatch");
  identity(record, version, superrepo, compiler);
  utc(record.recorded_utc, "recorded_utc");
  text(record.observer, "observer", { max: 200 });
  const digests = candidateDigests(evidence);
  exactKeys(record.candidate_cli_sha256, Object.keys(digests), "candidate_cli_sha256");
  for (const [target, digest] of Object.entries(digests)) if (record.candidate_cli_sha256[target] !== digest) Fail(`candidate CLI digest for ${target} is not the validated artifact`);
  if (!Array.isArray(record.participants) || record.participants.length !== 5) Fail("exactly five participants are required");
  const ids = new Set();
  let foundAdd = 0, completed = 0;
  for (const participant of record.participants) {
    exactKeys(participant, PARTICIPANT_KEYS, "participant");
    text(participant.id, "participant id", { max: 64 });
    if (ids.has(participant.id)) Fail(`participant ${participant.id} is repeated`);
    ids.add(participant.id);
    if (!TARGETS.includes(participant.target) || !(participant.target in digests)) Fail(`participant ${participant.id} target is not a candidate target`);
    if (participant.materials !== MATERIALS) Fail(`participant ${participant.id} received more than the installed CLI, its help and the language rules`);
    if (participant.language_rules_sha256 !== languageRules) Fail(`participant ${participant.id} language_rules_sha256 is not the committed handout ${LANGUAGE_RULES_PATH}`);
    const addFound = seconds(participant.add_found_seconds, `participant ${participant.id} add_found_seconds`);
    const journey = seconds(participant.journey_seconds, `participant ${participant.id} journey_seconds`);
    if (typeof participant.journey_completed !== "boolean") Fail(`participant ${participant.id} journey_completed must be boolean`);
    if (participant.journey_completed && journey === null) Fail(`participant ${participant.id} completed the journey without a duration`);
    if (!Array.isArray(participant.transcript) || !participant.transcript.length) Fail(`participant ${participant.id} has no transcript`);
    let sawVersion = false, previous = null;
    for (const entry of participant.transcript) {
      exactKeys(entry, ENTRY_KEYS, `participant ${participant.id} transcript entry`);
      utc(entry.utc, `participant ${participant.id} transcript timestamp`);
      if (previous !== null && Date.parse(entry.utc) < previous) Fail(`participant ${participant.id} transcript is not chronological`);
      previous = Date.parse(entry.utc);
      text(entry.command, `participant ${participant.id} command`);
      if (!Number.isSafeInteger(entry.exit_code)) Fail(`participant ${participant.id} transcript exit code must be an integer`);
      if (typeof entry.output !== "string" || entry.output.length > 65536) Fail(`participant ${participant.id} transcript output must be bounded text`);
      if (/^beskid(\.exe)?\s+--version$/.test(entry.command.trim())) {
        if (entry.exit_code !== 0 || entry.output.trim() !== `beskid ${version}`) Fail(`participant ${participant.id} ran a CLI that is not the candidate`);
        sawVersion = true;
      }
    }
    if (!sawVersion) Fail(`participant ${participant.id} transcript lacks beskid --version`);
    if (!Array.isArray(participant.failures) || participant.failures.some(item => typeof item !== "string")) Fail(`participant ${participant.id} failures must be strings`);
    if (participant.journey_completed && !participant.transcript.some(entry => /^beskid(\.exe)?\s+run\b/.test(entry.command.trim()) && entry.exit_code === 0)) Fail(`participant ${participant.id} claims completion without a successful beskid run`);
    if (addFound !== null && addFound <= 60) foundAdd++;
    if (participant.journey_completed && journey !== null && journey <= 300) completed++;
  }
  const threshold = observed => ({ observed, required: THRESHOLD, met: observed >= THRESHOLD });
  return { record, thresholds: { add_found_within_60s: threshold(foundAdd), journey_within_300s: threshold(completed) } };
}

// The published, non-blocking CLI06-06 result. `validated` is the ValidateObservation result or null.
export function ObservationReport(version, validated) {
  const base = { schema_version: 1, requirement: "CLI06-06", blocking: false, record_path: RecordPath(version) };
  if (!validated) return { ...base, status: "not-performed", summary: "CLI06-06 observation: not performed", thresholds: null, record: null };
  const { add_found_within_60s: add, journey_within_300s: journey } = validated.thresholds;
  const detail = `${add.observed} of 5 found add within 60 s; ${journey.observed} of 5 completed create/add/use/run within 300 s; ${THRESHOLD} of 5 required for each`;
  const pass = add.met && journey.met;
  return { ...base, status: pass ? "pass" : "below-threshold", summary: `CLI06-06 observation: ${pass ? "passed" : "below threshold"} (${detail})`, thresholds: validated.thresholds, record: validated.record };
}

function git(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: result.status === 0, out: result.stdout ?? "" };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function commitAt(repo, rev) {
  const out = git(repo, ["rev-parse", "--verify", "--quiet", `${rev}^{commit}`]);
  return out.ok ? out.out.trim() : null;
}
function gitlink(repo, commit, path) {
  const entry = git(repo, ["ls-tree", commit, "--", path]).out.trim();
  const match = /^160000 commit ([0-9a-f]{40})\t/.exec(entry);
  return match ? match[1] : null;
}
function manifestDigest(repo, commit) {
  const entry = git(repo, ["ls-tree", commit, "--", CASE_MANIFEST_PATH]).out.trim();
  if (!entry) return null;
  if (!entry.startsWith("100644 blob ")) Fail(`${CASE_MANIFEST_PATH} at ${commit} must be a regular file`);
  const shown = spawnSync("git", ["-C", repo, "show", `${commit}:${CASE_MANIFEST_PATH}`], { maxBuffer: 64 * 1024 * 1024 });
  if (shown.status !== 0) Fail(`cannot read ${CASE_MANIFEST_PATH} at ${commit}`);
  return sha256(shown.stdout);
}

// The record committed in HEAD at the version's fixed path, or null when none is committed.
export function CommittedRecord(repo, version, head) {
  const path = RecordPath(version);
  const entry = git(repo, ["ls-tree", head, "--", path]).out.trim();
  if (!entry) return null;
  if (!entry.startsWith("100644 blob ")) Fail(`${path} must be a regular file, not a symlink`);
  const shown = git(repo, ["show", `${head}:${path}`]);
  if (!shown.ok) Fail(`cannot read ${path} from HEAD`);
  try { return JSON.parse(shown.out); } catch { Fail(`${path} is not JSON`); }
}

// Candidate rule: resolve C and prove that HEAD carries C's artifact-determining inputs.
export function ResolveCandidate(repo, version, head, input = "") {
  parseExactReleaseVersion(version);
  if (!COMMIT.test(head)) Fail("release identity must name a 40-character HEAD commit");
  if (commitAt(repo, "HEAD") !== head) Fail("HEAD is not the release commit");
  if (input !== "" && !COMMIT.test(input)) Fail("the release candidate input must be a 40-character commit");
  const record = CommittedRecord(repo, version, head);
  let candidate = input || head;
  if (record !== null) {
    const named = record?.superrepo_commit;
    if (typeof named !== "string" || !COMMIT.test(named)) Fail("record does not name a 40-character candidate superrepo commit");
    if (named === head) Fail("the record cannot name the commit that contains it");
    if (input && input !== named) Fail(`the release candidate input ${input} differs from the record's candidate ${named}`);
    candidate = named;
  }
  if (commitAt(repo, candidate) !== candidate) Fail(`candidate ${candidate} is not a commit of this repository`);
  if (!git(repo, ["merge-base", "--is-ancestor", candidate, head]).ok) Fail(`candidate ${candidate} is not an ancestor of the release commit`);
  const identity = BuildIdentity(repo, candidate);
  sameBuildIdentity(repo, head, identity, "the release commit", candidate);
  return { candidate, record, identity };
}

// The artifact-determining inputs of one root commit.
export function BuildIdentity(repo, commit) {
  const identity = {};
  for (const path of BUILD_GITLINKS) {
    const pinned = gitlink(repo, commit, path);
    if (!pinned) Fail(`commit ${commit} has no ${path} gitlink`);
    identity[`${path}_commit`] = pinned;
  }
  identity.release_case_manifest_sha256 = manifestDigest(repo, commit);
  return identity;
}
function sameBuildIdentity(repo, commit, identity, label, candidate) {
  const actual = {};
  for (const path of BUILD_GITLINKS) actual[`${path}_commit`] = gitlink(repo, commit, path);
  for (const path of BUILD_GITLINKS) {
    if (actual[`${path}_commit`] !== identity[`${path}_commit`]) Fail(`the ${path} pointer of ${label} differs from candidate ${candidate}`);
  }
  if (manifestDigest(repo, commit) !== identity.release_case_manifest_sha256) Fail(`the release-case manifest digest of ${label} differs from candidate ${candidate}`);
}

// Per-platform handoff sources. Each platform's build may come from its own root commit P (default:
// the candidate C) when P has C's build identity, is HEAD or an ancestor of HEAD, and the root diff
// C..P touches only NON_BUILD_PATHS. Any two such sources then differ only in non-build paths.
export function ResolvePlatformSources(repo, version, head, input = "", overrides = {}) {
  const { candidate, identity } = ResolveCandidate(repo, version, head, input);
  const sources = {};
  for (const role of PLATFORM_ROLES) {
    const source = overrides[role] || candidate;
    if (!COMMIT.test(source)) Fail(`the ${role} source must be a 40-character commit`);
    if (commitAt(repo, source) !== source) Fail(`${role} source ${source} is not a commit of this repository`);
    if (!git(repo, ["merge-base", "--is-ancestor", source, head]).ok) Fail(`${role} source ${source} is not an ancestor of the release commit`);
    sameBuildIdentity(repo, source, identity, `the ${role} source ${source}`, candidate);
    const diff = git(repo, ["diff", "--no-renames", "--name-only", candidate, source]);
    if (!diff.ok) Fail(`cannot compare the ${role} source ${source} with candidate ${candidate}`);
    const build = diff.out.split("\n").filter(Boolean).filter(path => !NON_BUILD_PATHS.some(pattern => pattern.test(path)));
    if (build.length) Fail(`the ${role} source ${source} changes build inputs relative to candidate ${candidate}: ${build.join(", ")}`);
    sources[role] = source;
  }
  if (!Object.values(sources).includes(candidate)) Fail(`no platform source is the candidate ${candidate}; the release source identity must be a built commit`);
  return { candidate, build_identity: identity, sources };
}

// The root commit that packaged one platform's handoff. `packaging` is the build source itself, or a
// repackaging root P: a descendant of the source, HEAD or an ancestor of HEAD, with the source's build
// identity, whose root diff from the source touches only NON_BUILD_PATHS and REPACKAGE_ALLOWED_PATHS.
// Returns the distrib commit the installers were packaged with.
export function ValidatePackagingRoot(repo, source, packaging, head) {
  for (const [label, value] of [["source", source], ["packaging root", packaging], ["HEAD", head]]) {
    if (!COMMIT.test(value) || commitAt(repo, value) !== value) Fail(`the ${label} ${value} is not a commit of this repository`);
  }
  if (!git(repo, ["merge-base", "--is-ancestor", packaging, head]).ok) Fail(`packaging root ${packaging} is not HEAD or an ancestor of HEAD`);
  if (packaging !== source) {
    if (!git(repo, ["merge-base", "--is-ancestor", source, packaging]).ok) Fail(`packaging root ${packaging} does not descend from the build source ${source}`);
    sameBuildIdentity(repo, packaging, BuildIdentity(repo, source), `the packaging root ${packaging}`, source);
    const diff = git(repo, ["diff", "--no-renames", "--name-only", source, packaging]);
    if (!diff.ok) Fail(`cannot compare packaging root ${packaging} with the build source ${source}`);
    const changed = diff.out.split("\n").filter(Boolean)
      .filter(path => !NON_BUILD_PATHS.some(pattern => pattern.test(path)) && !REPACKAGE_ALLOWED_PATHS.some(pattern => pattern.test(path)));
    if (changed.length) Fail(`packaging root ${packaging} changes inputs other than packaging relative to the build source ${source}: ${changed.join(", ")}`);
  }
  const distrib = gitlink(repo, packaging, PACKAGING_GITLINK);
  if (!distrib) Fail(`packaging root ${packaging} has no ${PACKAGING_GITLINK} gitlink`);
  return { source, packaging_commit: packaging, distrib_commit: distrib };
}

// The commit whose per-platform build handoffs the release consumes and whose identity the release state carries.
export function ReleaseSource(repo, version, head, input = "") {
  return ResolveCandidate(repo, version, head, input).candidate;
}

// Release report: re-resolve the candidate, bind the validated evidence to it and report the
// committed record, if any. Throws only on an invalid or forged record or on identity drift.
export function ReleaseObservation(repo, version, head, candidate, compiler, evidence) {
  if (!COMMIT.test(candidate) || !COMMIT.test(compiler)) Fail("release identity must name a 40-character candidate and compiler commit");
  const resolved = ResolveCandidate(repo, version, head, candidate);
  if (resolved.candidate !== candidate) Fail("release candidate differs from the resolved candidate");
  if (gitlink(repo, candidate, "compiler") !== compiler) Fail("candidate compiler pointer differs from the release identity");
  if (evidence?.source?.superrepo_commit !== candidate || evidence?.source?.compiler_commit !== compiler) Fail("validated evidence is not the build of the release candidate");
  if (resolved.record === null) return ObservationReport(version, null);
  return ObservationReport(version, ValidateObservation(resolved.record, version, candidate, compiler, evidence, LanguageRulesDigest()));
}

function regularFile(path) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) Fail(`${path} must be a regular file, not a symlink`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    let output;
    if (args[0] === "--source") {
      if (args.length !== 4 && args.length !== 5) Fail("usage: release-user-observation.mjs --source <repo> <version> <head-sha> [<candidate-sha>]");
      output = ReleaseSource(args[1], args[2], args[3], args[4] ?? "");
    } else if (args[0] === "--platform-sources") {
      if (args.length !== 8) Fail("usage: release-user-observation.mjs --platform-sources <repo> <version> <head-sha> <candidate-sha|''> <linux-sha|''> <macos-sha|''> <windows-sha|''>");
      const [, repo, version, head, input, linux, macos, windows] = args;
      output = JSON.stringify(ResolvePlatformSources(repo, version, head, input, { linux, macos, windows }));
    } else if (args[0] === "--packaging-root") {
      if (args.length !== 5) Fail("usage: release-user-observation.mjs --packaging-root <repo> <source-sha> <packaging-sha> <head-sha>");
      output = JSON.stringify(ValidatePackagingRoot(args[1], args[2], args[3], args[4]));
    } else if (args[0] === "--release") {
      const [, repo, version, head, candidate, compiler, evidencePath] = args;
      if (args.length !== 7) Fail("usage: release-user-observation.mjs --release <repo> <version> <head-sha> <candidate-sha> <compiler-sha> <validated-evidence.json>");
      regularFile(evidencePath);
      output = JSON.stringify(ReleaseObservation(repo, version, head, candidate, compiler, JSON.parse(readFileSync(evidencePath, "utf8"))));
    } else {
      const [recordPath, version, superrepo, compiler, evidencePath] = args;
      if (args.length !== 5) Fail("usage: release-user-observation.mjs <record.json> <version> <candidate-superrepo-sha> <compiler-sha> <validated-evidence.json>");
      for (const path of [recordPath, evidencePath]) regularFile(path);
      output = JSON.stringify(ObservationReport(version, ValidateObservation(JSON.parse(readFileSync(recordPath, "utf8")), version, superrepo, compiler, JSON.parse(readFileSync(evidencePath, "utf8")))));
    }
    process.stdout.write(`${output}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

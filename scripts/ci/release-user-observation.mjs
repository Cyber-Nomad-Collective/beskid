#!/usr/bin/env node
// Validate the CLI06-06 uncoached-observation record of one 0.6 candidate.
//
// Usage:
//   release-user-observation.mjs <record.json> <version> <candidate-superrepo-sha> <compiler-sha> <validated-evidence.json>
//   release-user-observation.mjs --source <repo> <version> <head-sha>
//   release-user-observation.mjs --release <repo> <version> <head-sha> <compiler-sha> <validated-evidence.json>
//
// The first form validates one record file. A 0.6 release runs on a record commit: HEAD adds only
// docs/release/cli06-06-record-v<version>.json on top of the frozen candidate that the record names
// (a commit cannot contain its own sha). `--source` prints the release source commit: that candidate
// for a 0.6 version, HEAD otherwise. The release fetches, aggregates and publishes the candidate's own
// per-platform build handoffs, so the record is checked against the exact CLI files the participants installed and
// those files are what ships. `--release` is the gate on the record itself. An absent record fails,
// which blocks publication.
//
// Participants see the installed CLI, its help and the language-rules handout of the kit, nothing
// else. Each participant declares `materials: "cli-help+language-rules"` and the sha256 of the
// handout shown; the digest must equal the committed handout.
//
// The record is observer-attested: the validator checks shape, thresholds, per-participant
// transcripts (each must include `beskid --version` printing the candidate version) and that the
// recorded candidate CLI digests are the validated aggregate's own CLI artifacts. It cannot prove
// that five people existed or were uncoached; `verification: "observer-attested"` says so in the
// release state. A record below either four-of-five threshold fails, which blocks publication.
//
// Fallback: a dated release-owner waiver (`decision: "release-owner-user-observation-waiver"`) is
// accepted only for versions before 0.6.1 and records the unmet SHALL plus the 0.6.1 obligation.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compareStableReleaseVersions, parseExactReleaseVersion } from "./release-version.mjs";

const TARGETS = ["x86_64-unknown-linux-gnu", "aarch64-apple-darwin", "x86_64-pc-windows-msvc"];
const COMMIT = /^[0-9a-f]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const WAIVER_EXPIRY = "0.6.1";
const MATERIALS = "cli-help+language-rules";
export const LANGUAGE_RULES_PATH = "docs/release/cli06-06-usability-check/language-rules.md";
const LANGUAGE_RULES_FILE = fileURLToPath(new URL(`../../${LANGUAGE_RULES_PATH}`, import.meta.url));
const RECORD_KEYS = ["schema_version", "kind", "verification", "version", "superrepo_commit", "compiler_commit", "candidate_cli_sha256", "recorded_utc", "observer", "participants"];
const PARTICIPANT_KEYS = ["id", "target", "materials", "language_rules_sha256", "add_found_seconds", "journey_completed", "journey_seconds", "transcript", "failures"];
const ENTRY_KEYS = ["utc", "command", "exit_code", "output"];
const WAIVER_KEYS = ["schema_version", "kind", "decision", "scope", "version", "superrepo_commit", "compiler_commit", "approved_utc", "owner", "unmet_requirement", "obligation", "expires_version"];

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
  if (record.kind === "cli06-06-uncoached-observation-waiver") return validateWaiver(record, version, superrepo, compiler, evidence);
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
  if (foundAdd < 4) Fail(`only ${foundAdd} of 5 participants found add within 60 seconds`);
  if (completed < 4) Fail(`only ${completed} of 5 participants completed create/add/use/run within five minutes`);
  return { ...record, thresholds: { add_found_within_60s: foundAdd, journey_within_300s: completed } };
}

function validateWaiver(record, version, superrepo, compiler, evidence) {
  exactKeys(record, WAIVER_KEYS, "waiver");
  if (record.schema_version !== 1 || record.decision !== "release-owner-user-observation-waiver" || record.scope !== "cli06-06-uncoached-observation-only") Fail("waiver decision or scope mismatch");
  identity(record, version, superrepo, compiler);
  utc(record.approved_utc, "approved_utc");
  text(record.owner, "owner", { max: 200 });
  text(record.unmet_requirement, "unmet_requirement");
  exactKeys(record.obligation, ["version", "action"], "obligation");
  if (record.obligation.version !== WAIVER_EXPIRY || record.expires_version !== WAIVER_EXPIRY) Fail(`the user observation waiver expires at ${WAIVER_EXPIRY}; later versions need the observation`);
  text(record.obligation.action, "obligation action");
  if (compareStableReleaseVersions(version, WAIVER_EXPIRY) >= 0) Fail(`waiver expired for ${version}`);
  candidateDigests(evidence);
  return { ...record, verification: "owner-waiver" };
}

function git(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: result.status === 0, out: result.stdout ?? "" };
}

export function ObservationRequired(version) {
  return /^0\.6\.\d+$/.test(parseExactReleaseVersion(version, { stableOnly: true }));
}

// The candidate named by the record committed in HEAD, after the record-commit shape checks.
export function CommittedCandidate(repo, version, head) {
  const path = RecordPath(version);
  if (!COMMIT.test(head)) Fail("release identity must name a 40-character HEAD commit");
  if (git(repo, ["rev-parse", "--verify", "HEAD^{commit}"]).out.trim() !== head) Fail("HEAD is not the release commit");
  const entry = git(repo, ["ls-tree", "HEAD", "--", path]).out.trim();
  if (!entry) Fail(`no record is committed at ${path}; publication is blocked`);
  if (!entry.startsWith("100644 blob ")) Fail(`${path} must be a regular file, not a symlink`);
  const shown = git(repo, ["show", `HEAD:${path}`]);
  if (!shown.ok) Fail(`cannot read ${path} from HEAD`);
  let record;
  try { record = JSON.parse(shown.out); } catch { Fail(`${path} is not JSON`); }
  const candidate = record?.superrepo_commit;
  if (typeof candidate !== "string" || !COMMIT.test(candidate)) Fail("record does not name a 40-character candidate superrepo commit");
  if (candidate === head) Fail("the record cannot name the commit that contains it");
  if (!git(repo, ["merge-base", "--is-ancestor", candidate, head]).ok) Fail(`candidate ${candidate} is not an ancestor of the release commit`);
  const changed = git(repo, ["diff", "--no-renames", "--name-only", candidate, head]);
  if (!changed.ok || changed.out.trim() !== path) Fail(`the release commit must differ from candidate ${candidate} only by ${path}`);
  return { candidate, record };
}

// The commit whose per-platform build handoffs the release consumes and whose identity the release state carries.
export function ReleaseSource(repo, version, head) {
  if (!ObservationRequired(version)) {
    if (!COMMIT.test(head)) Fail("release identity must name a 40-character HEAD commit");
    return head;
  }
  return CommittedCandidate(repo, version, head).candidate;
}

// Release gate: the committed record of `version` in HEAD of `repo`, checked against the candidate it
// names and the validated evidence aggregated from that candidate's per-platform build handoffs.
export function ValidateCommittedObservation(repo, version, head, compiler, evidence) {
  if (!COMMIT.test(compiler)) Fail("release identity must name a 40-character compiler commit");
  const { candidate, record } = CommittedCandidate(repo, version, head);
  if (git(repo, ["rev-parse", "--verify", `${candidate}:compiler`]).out.trim() !== compiler) Fail("candidate compiler pointer differs from the release identity");
  if (evidence?.source?.superrepo_commit !== candidate || evidence?.source?.compiler_commit !== compiler) Fail("validated evidence is not the build of the record's candidate");
  return ValidateObservation(record, version, candidate, compiler, evidence, LanguageRulesDigest());
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
      if (args.length !== 4) Fail("usage: release-user-observation.mjs --source <repo> <version> <head-sha>");
      output = ReleaseSource(args[1], args[2], args[3]);
    } else if (args[0] === "--release") {
      const [, repo, version, head, compiler, evidencePath] = args;
      if (args.length !== 6) Fail("usage: release-user-observation.mjs --release <repo> <version> <head-sha> <compiler-sha> <validated-evidence.json>");
      regularFile(evidencePath);
      output = JSON.stringify(ValidateCommittedObservation(repo, version, head, compiler, JSON.parse(readFileSync(evidencePath, "utf8"))));
    } else {
      const [recordPath, version, superrepo, compiler, evidencePath] = args;
      if (args.length !== 5) Fail("usage: release-user-observation.mjs <record.json> <version> <candidate-superrepo-sha> <compiler-sha> <validated-evidence.json>");
      for (const path of [recordPath, evidencePath]) regularFile(path);
      output = JSON.stringify(ValidateObservation(JSON.parse(readFileSync(recordPath, "utf8")), version, superrepo, compiler, JSON.parse(readFileSync(evidencePath, "utf8"))));
    }
    process.stdout.write(`${output}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

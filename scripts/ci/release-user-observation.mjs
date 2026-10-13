#!/usr/bin/env node
// Validate the CLI06-06 uncoached-observation record of one 0.6 candidate.
//
// Usage: release-user-observation.mjs <record.json> <version> <superrepo-sha> <compiler-sha> <validated-evidence.json>
//
// The record is observer-attested: the validator checks shape, thresholds, per-participant
// transcripts (each must include `beskid --version` printing the candidate version) and that the
// recorded candidate CLI digests are the validated aggregate's own CLI artifacts. It cannot prove
// that five people existed or were uncoached; `verification: "observer-attested"` says so in the
// release state. A record below either four-of-five threshold fails, which blocks publication.
//
// Fallback: a dated release-owner waiver (`decision: "release-owner-user-observation-waiver"`) is
// accepted only for versions before 0.6.1 and records the unmet SHALL plus the 0.6.1 obligation.
import { lstatSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { compareStableReleaseVersions, parseExactReleaseVersion } from "./release-version.mjs";

const TARGETS = ["x86_64-unknown-linux-gnu", "aarch64-apple-darwin", "x86_64-pc-windows-msvc"];
const COMMIT = /^[0-9a-f]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const WAIVER_EXPIRY = "0.6.1";
const RECORD_KEYS = ["schema_version", "kind", "verification", "version", "superrepo_commit", "compiler_commit", "candidate_cli_sha256", "recorded_utc", "observer", "participants"];
const PARTICIPANT_KEYS = ["id", "target", "help_only", "add_found_seconds", "journey_completed", "journey_seconds", "transcript", "failures"];
const ENTRY_KEYS = ["utc", "command", "exit_code", "output"];
const WAIVER_KEYS = ["schema_version", "kind", "decision", "scope", "version", "superrepo_commit", "compiler_commit", "approved_utc", "owner", "unmet_requirement", "obligation", "expires_version"];

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

export function ValidateObservation(record, version, superrepo, compiler, evidence) {
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
    if (participant.help_only !== true) Fail(`participant ${participant.id} received more than the installed CLI and its help`);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [recordPath, version, superrepo, compiler, evidencePath] = process.argv.slice(2);
    if (!recordPath || !version || !superrepo || !compiler || !evidencePath) Fail("usage: release-user-observation.mjs <record.json> <version> <superrepo-sha> <compiler-sha> <validated-evidence.json>");
    for (const path of [recordPath, evidencePath]) {
      const stat = lstatSync(path);
      if (stat.isSymbolicLink() || !stat.isFile()) Fail(`${path} must be a regular file, not a symlink`);
    }
    const record = JSON.parse(readFileSync(recordPath, "utf8"));
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    process.stdout.write(`${JSON.stringify(ValidateObservation(record, version, superrepo, compiler, evidence))}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

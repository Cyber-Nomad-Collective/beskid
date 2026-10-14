import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { LANGUAGE_RULES_PATH, LanguageRulesDigest, RecordPath, ReleaseSource, ValidateCommittedObservation, ValidateObservation } from "../release-user-observation.mjs";

const script = new URL("../release-user-observation.mjs", import.meta.url).pathname;
const repoRoot = new URL("../../../", import.meta.url).pathname;
const kit = join(repoRoot, "docs/release/cli06-06-usability-check");
const RULES = LanguageRulesDigest();
const VERSION = "0.6.0";
const SUPERREPO = "a".repeat(40);
const COMPILER = "b".repeat(40);
const TARGETS = ["x86_64-unknown-linux-gnu", "aarch64-apple-darwin", "x86_64-pc-windows-msvc"];
const digests = Object.fromEntries(TARGETS.map((target, index) => [target, String(index + 1).repeat(64)]));
const evidence = {
  version: VERSION, source: { superrepo_commit: SUPERREPO, compiler_commit: COMPILER },
  platforms: TARGETS.map((target, index) => {
    const cli = ["beskid-linux-amd64", "beskid-darwin-arm64", "beskid-windows-amd64.exe"][index];
    return { platform: ["linux", "macos", "windows"][index], target, release_assets: [cli, "lsp", "bundle.tar.gz"], artifacts: [{ name: cli, sha256: digests[target] }, { name: "lsp", sha256: "f".repeat(64) }] };
  }),
};

function transcript(start, steps) {
  const entries = [{ utc: start, command: "beskid --version", exit_code: 0, output: `beskid ${VERSION}\n` }];
  let seconds = 10;
  for (const [command, exit_code] of steps) {
    entries.push({ utc: new Date(Date.parse(start) + seconds * 1000).toISOString().replace(/\.\d{3}Z$/, "Z"), command, exit_code, output: "" });
    seconds += 20;
  }
  return entries;
}
function participant(id, target, { addFound = 30, completed = true, journey = 240 } = {}) {
  return { id, target, materials: "cli-help+language-rules", language_rules_sha256: RULES, add_found_seconds: addFound, journey_completed: completed, journey_seconds: completed ? journey : null,
    transcript: transcript("2026-10-20T10:00:00Z", [["beskid --help", 0], ["beskid new hello", 0], ["beskid add --help", 0], ["beskid add Greeter --path ../Greeter", 0], ...(completed ? [["beskid run", 0]] : [["beskid run", 1]])]),
    failures: completed ? [] : ["did not reach run within five minutes"] };
}
function record(overrides = {}) {
  return {
    schema_version: 1, kind: "cli06-06-uncoached-observation", verification: "observer-attested", version: VERSION,
    superrepo_commit: SUPERREPO, compiler_commit: COMPILER, candidate_cli_sha256: { ...digests }, recorded_utc: "2026-10-20T12:00:00Z", observer: "release owner",
    participants: [participant("p1", TARGETS[0]), participant("p2", TARGETS[1]), participant("p3", TARGETS[2]), participant("p4", TARGETS[0], { addFound: 55 }), participant("p5", TARGETS[1], { addFound: 90, completed: false })],
    ...overrides,
  };
}
function waiver(overrides = {}) {
  return { schema_version: 1, kind: "cli06-06-uncoached-observation-waiver", decision: "release-owner-user-observation-waiver", scope: "cli06-06-uncoached-observation-only",
    version: VERSION, superrepo_commit: SUPERREPO, compiler_commit: COMPILER, approved_utc: "2026-10-20T12:00:00Z", owner: "release owner",
    unmet_requirement: "Installed beginner workflow acceptance: five uncoached participants were not observed for 0.6.0",
    obligation: { version: "0.6.1", action: "observe five fresh participants on the 0.6.1 candidate before publication" }, expires_version: "0.6.1", ...overrides };
}
const validate = (value, version = VERSION) => ValidateObservation(value, version, SUPERREPO, COMPILER, evidence);
const rejects = (value, pattern, version = VERSION) => assert.throws(() => validate(value, version), pattern);

test("a complete observer-attested record with four-of-five thresholds validates", () => {
  const result = validate(record());
  assert.equal(result.verification, "observer-attested");
  assert.deepEqual(result.thresholds, { add_found_within_60s: 4, journey_within_300s: 4 });
});
test("thresholds are enforced on both halves", () => {
  const slowAdd = record(); slowAdd.participants[3].add_found_seconds = 61;
  rejects(slowAdd, /only 3 of 5 participants found add/);
  const slowJourney = record(); slowJourney.participants[3].journey_seconds = 301;
  rejects(slowJourney, /only 3 of 5 participants completed/);
  const incomplete = record(); incomplete.participants[3].journey_completed = false; incomplete.participants[3].journey_seconds = null;
  rejects(incomplete, /only 3 of 5/);
});
test("participants are exactly five, unique, limited to the pinned materials and on candidate targets", () => {
  rejects(record({ participants: record().participants.slice(0, 4) }), /exactly five/);
  const duplicate = record(); duplicate.participants[1].id = "p1"; rejects(duplicate, /repeated/);
  const coached = record(); coached.participants[0].materials = "cli-help+language-rules+tutor"; rejects(coached, /more than the installed CLI/);
  const helpOnly = record(); delete helpOnly.participants[0].materials; helpOnly.participants[0].help_only = true; rejects(helpOnly, /unexpected fields/);
  const otherRules = record(); otherRules.participants[0].language_rules_sha256 = "0".repeat(64); rejects(otherRules, /not the committed handout/);
  const missingRules = record(); delete missingRules.participants[0].language_rules_sha256; rejects(missingRules, /unexpected fields/);
  const foreign = record(); foreign.participants[0].target = "riscv64gc-unknown-linux-gnu"; rejects(foreign, /candidate target/);
});
test("transcripts ground the candidate identity", () => {
  const noVersion = record(); noVersion.participants[0].transcript.shift(); rejects(noVersion, /lacks beskid --version/);
  const otherCli = record(); otherCli.participants[0].transcript[0].output = "beskid 0.5.2\n"; rejects(otherCli, /not the candidate/);
  const unordered = record(); unordered.participants[0].transcript[1].utc = "2026-10-20T09:00:00Z"; rejects(unordered, /chronological/);
  const noRun = record(); noRun.participants[0].transcript.pop(); rejects(noRun, /without a successful beskid run/);
  const wrongDigest = record(); wrongDigest.candidate_cli_sha256[TARGETS[0]] = "0".repeat(64); rejects(wrongDigest, /not the validated artifact/);
  rejects(record({ version: "0.6.1" }), /identity mismatch/);
  rejects(record({ verification: "machine-verified" }), /verification mismatch/);
  rejects(record({ extra: true }), /unexpected fields/);
});
test("the owner waiver is accepted only before 0.6.1 with the recorded obligation", () => {
  const accepted = validate(waiver());
  assert.equal(accepted.verification, "owner-waiver");
  rejects(waiver({ version: "0.6.1" }), /expired/, "0.6.1");
  rejects(waiver({ expires_version: "0.7.0", obligation: { version: "0.7.0", action: "later" } }), /expires at 0\.6\.1/);
  rejects(waiver({ scope: "all-release-gates" }), /scope mismatch/);
  rejects(waiver({ obligation: { version: "0.6.1" } }), /obligation/);
});
test("the command line validates files, refuses symlinks and prints the record", (t) => {
  const root = mkdtempSync(join(tmpdir(), "beskid-observation-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "record.json"), JSON.stringify(record()));
  writeFileSync(join(root, "evidence.json"), JSON.stringify(evidence));
  const ok = spawnSync(process.execPath, [script, join(root, "record.json"), VERSION, SUPERREPO, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(JSON.parse(ok.stdout).thresholds.add_found_within_60s, 4);
  symlinkSync(join(root, "record.json"), join(root, "linked.json"));
  const linked = spawnSync(process.execPath, [script, join(root, "linked.json"), VERSION, SUPERREPO, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.notEqual(linked.status, 0);
  assert.match(linked.stderr, /symlink/);
  const failing = record(); failing.participants[3].add_found_seconds = 61;
  writeFileSync(join(root, "failing.json"), JSON.stringify(failing));
  const blocked = spawnSync(process.execPath, [script, join(root, "failing.json"), VERSION, SUPERREPO, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.notEqual(blocked.status, 0, "a failing record blocks publication");
});

test("the kit example validates and the kit names the committed handout digest", () => {
  assert.match(RULES, /^[a-f0-9]{64}$/);
  assert.equal(LANGUAGE_RULES_PATH, "docs/release/cli06-06-usability-check/language-rules.md");
  const example = JSON.parse(readFileSync(join(kit, "record-example.json"), "utf8"));
  const exampleEvidence = JSON.parse(readFileSync(join(kit, "example-validated-evidence.json"), "utf8"));
  assert.equal(ValidateObservation(example, VERSION, SUPERREPO, COMPILER, exampleEvidence).thresholds.add_found_within_60s, 4);
  for (const name of ["README.md", "observer-sheet.md", "record-template.json"]) {
    assert.ok(readFileSync(join(kit, name), "utf8").includes(RULES), `${name} names the handout digest`);
  }
  const handout = readFileSync(join(kit, "language-rules.md"), "utf8");
  assert.doesNotMatch(handout, /beskid (add|new|run|build|check)\b/, "the handout does not reveal the CLI journey");
});

function git(cwd, ...args) {
  const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function candidateRepo(t) {
  const root = mkdtempSync(join(tmpdir(), "beskid-observation-repo-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, "init", "-q"); git(root, "config", "user.email", "observation@example.invalid"); git(root, "config", "user.name", "observation");
  writeFileSync(join(root, "README"), "candidate\n");
  git(root, "add", "README");
  git(root, "update-index", "--add", "--cacheinfo", `160000,${COMPILER},compiler`);
  git(root, "commit", "-q", "-m", "candidate");
  return { root, candidate: git(root, "rev-parse", "HEAD") };
}
const built = (candidate) => ({ ...evidence, source: { superrepo_commit: candidate, compiler_commit: COMPILER } });
function commitRecord(root, value, extra = () => {}) {
  mkdirSync(join(root, "docs/release"), { recursive: true });
  writeFileSync(join(root, RecordPath(VERSION)), JSON.stringify(value));
  git(root, "add", RecordPath(VERSION));
  extra(root);
  git(root, "commit", "-q", "-m", "record");
  return git(root, "rev-parse", "HEAD");
}

test("the release source of a 0.6 version is the candidate the committed record names", (t) => {
  const { root, candidate } = candidateRepo(t);
  assert.equal(ReleaseSource(root, "0.7.0", candidate), candidate, "other series release HEAD");
  assert.throws(() => ReleaseSource(root, VERSION, candidate), /no record is committed at docs\/release\/cli06-06-record-v0\.6\.0\.json/);
  const head = commitRecord(root, record({ superrepo_commit: candidate }));
  assert.equal(ReleaseSource(root, VERSION, head), candidate);
  const cli = spawnSync(process.execPath, [script, "--source", root, VERSION, head], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.stdout.trim(), candidate);
  assert.throws(() => ReleaseSource(root, VERSION, candidate), /not the release commit/);
});
test("the release gate checks the record against the candidate's own build evidence", (t) => {
  const { root, candidate } = candidateRepo(t);
  const head = commitRecord(root, record({ superrepo_commit: candidate }));
  assert.equal(ValidateCommittedObservation(root, VERSION, head, COMPILER, built(candidate)).superrepo_commit, candidate);
  assert.throws(() => ValidateCommittedObservation(root, VERSION, head, COMPILER, built(head)), /not the build of the record's candidate/);
  assert.throws(() => ValidateCommittedObservation(root, VERSION, head, COMPILER, evidence), /not the build of the record's candidate/);
  const otherCli = built(candidate); otherCli.platforms = otherCli.platforms.map((platform, index) => index ? platform : { ...platform, artifacts: [{ name: platform.release_assets[0], sha256: "e".repeat(64) }] });
  assert.throws(() => ValidateCommittedObservation(root, VERSION, head, COMPILER, otherCli), /not the validated artifact/);
  const cli = spawnSync(process.execPath, [script, "--release", root, VERSION, head, COMPILER, join(root, "missing-evidence.json")], { encoding: "utf8" });
  assert.notEqual(cli.status, 0);
});
test("the release gate refuses a record that is not the only change since the candidate", (t) => {
  const { root, candidate } = candidateRepo(t);
  const head = commitRecord(root, record({ superrepo_commit: candidate }), (dir) => { writeFileSync(join(dir, "README"), "changed\n"); git(dir, "add", "README"); });
  assert.throws(() => ReleaseSource(root, VERSION, head), /only by docs\/release\/cli06-06-record-v0\.6\.0\.json/);
  const second = commitRecord(root, record({ superrepo_commit: "c".repeat(40) }));
  assert.throws(() => ReleaseSource(root, VERSION, second), /not an ancestor/);
});
test("the release gate refuses another compiler pointer and a failing record", (t) => {
  const { root, candidate } = candidateRepo(t);
  const head = commitRecord(root, record({ superrepo_commit: candidate }));
  assert.throws(() => ValidateCommittedObservation(root, VERSION, head, "d".repeat(40), built(candidate)), /compiler pointer/);
  const { root: other, candidate: base } = candidateRepo(t);
  const failing = record({ superrepo_commit: base }); failing.participants[3].add_found_seconds = 61;
  const failingHead = commitRecord(other, failing);
  assert.throws(() => ValidateCommittedObservation(other, VERSION, failingHead, COMPILER, built(base)), /only 3 of 5/);
});
test("the release gate refuses a symlinked record", (t) => {
  const { root, candidate } = candidateRepo(t);
  writeFileSync(join(root, "real.json"), JSON.stringify(record({ superrepo_commit: candidate })));
  mkdirSync(join(root, "docs/release"), { recursive: true });
  symlinkSync("../../real.json", join(root, RecordPath(VERSION)));
  git(root, "add", RecordPath(VERSION)); git(root, "commit", "-q", "-m", "link");
  assert.throws(() => ReleaseSource(root, VERSION, git(root, "rev-parse", "HEAD")), /regular file/);
});

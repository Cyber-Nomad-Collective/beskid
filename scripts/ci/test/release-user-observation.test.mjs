import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { BuildIdentity, CASE_MANIFEST_PATH, NON_BUILD_PATHS, REPACKAGE_ALLOWED_PATHS, ResolvePlatformSources, ValidatePackagingRoot, LANGUAGE_RULES_PATH, LanguageRulesDigest, ObservationReport, RecordPath, ReleaseObservation, ReleaseSource, ValidateObservation } from "../release-user-observation.mjs";

const script = new URL("../release-user-observation.mjs", import.meta.url).pathname;
const repoRoot = new URL("../../../", import.meta.url).pathname;
const kit = join(repoRoot, "docs/release/cli06-06-usability-check");
const RULES = LanguageRulesDigest();
const VERSION = "0.6.0";
const SUPERREPO = "a".repeat(40);
const COMPILER = "b".repeat(40);
const DISTRIB = "9".repeat(40);
const BSOL = "8".repeat(40);
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
const validate = (value, version = VERSION) => ValidateObservation(value, version, SUPERREPO, COMPILER, evidence);
const rejects = (value, pattern, version = VERSION) => assert.throws(() => validate(value, version), pattern);

test("a complete observer-attested record with four-of-five thresholds validates and passes", () => {
  const result = validate(record());
  assert.equal(result.record.verification, "observer-attested");
  assert.deepEqual(result.thresholds, { add_found_within_60s: { observed: 4, required: 4, met: true }, journey_within_300s: { observed: 4, required: 4, met: true } });
  const report = ObservationReport(VERSION, result);
  assert.equal(report.status, "pass");
  assert.equal(report.blocking, false);
  assert.match(report.summary, /^CLI06-06 observation: passed \(4 of 5 found add within 60 s; 4 of 5 completed/);
});
test("a valid record below either threshold is reported, not rejected", () => {
  const slowAdd = record(); slowAdd.participants[3].add_found_seconds = 61;
  const add = validate(slowAdd);
  assert.deepEqual(add.thresholds.add_found_within_60s, { observed: 3, required: 4, met: false });
  assert.equal(add.thresholds.journey_within_300s.met, true);
  const report = ObservationReport(VERSION, add);
  assert.equal(report.status, "below-threshold");
  assert.match(report.summary, /^CLI06-06 observation: below threshold \(3 of 5 found add/);
  const slowJourney = record(); slowJourney.participants[3].journey_seconds = 301;
  assert.equal(validate(slowJourney).thresholds.journey_within_300s.observed, 3);
  const incomplete = record(); incomplete.participants[3].journey_completed = false; incomplete.participants[3].journey_seconds = null;
  assert.equal(ObservationReport(VERSION, validate(incomplete)).status, "below-threshold");
});
test("a missing record is reported as not performed", () => {
  const report = ObservationReport(VERSION, null);
  assert.deepEqual(report, { schema_version: 1, requirement: "CLI06-06", blocking: false, record_path: RecordPath(VERSION), status: "not-performed", summary: "CLI06-06 observation: not performed", thresholds: null, record: null });
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
test("the retired owner waiver is an invalid record", () => {
  const waiver = { schema_version: 1, kind: "cli06-06-uncoached-observation-waiver", decision: "release-owner-user-observation-waiver", scope: "cli06-06-uncoached-observation-only",
    version: VERSION, superrepo_commit: SUPERREPO, compiler_commit: COMPILER, approved_utc: "2026-10-20T12:00:00Z", owner: "release owner",
    unmet_requirement: "not observed", obligation: { version: "0.6.1", action: "observe" }, expires_version: "0.6.1" };
  rejects(waiver, /unexpected fields/);
});
test("the command line validates files, refuses symlinks and prints the record", (t) => {
  const root = mkdtempSync(join(tmpdir(), "beskid-observation-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "record.json"), JSON.stringify(record()));
  writeFileSync(join(root, "evidence.json"), JSON.stringify(evidence));
  const ok = spawnSync(process.execPath, [script, join(root, "record.json"), VERSION, SUPERREPO, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(JSON.parse(ok.stdout).status, "pass");
  symlinkSync(join(root, "record.json"), join(root, "linked.json"));
  const linked = spawnSync(process.execPath, [script, join(root, "linked.json"), VERSION, SUPERREPO, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.notEqual(linked.status, 0);
  assert.match(linked.stderr, /symlink/);
  const failing = record(); failing.participants[3].add_found_seconds = 61;
  writeFileSync(join(root, "failing.json"), JSON.stringify(failing));
  const below = spawnSync(process.execPath, [script, join(root, "failing.json"), VERSION, SUPERREPO, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.equal(below.status, 0, "a record below a threshold does not block publication");
  assert.equal(JSON.parse(below.stdout).status, "below-threshold");
  const forged = record(); forged.candidate_cli_sha256[TARGETS[0]] = "0".repeat(64);
  writeFileSync(join(root, "forged.json"), JSON.stringify(forged));
  const blocked = spawnSync(process.execPath, [script, join(root, "forged.json"), VERSION, SUPERREPO, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.notEqual(blocked.status, 0, "a forged record blocks publication");
});

test("the kit example validates and the kit names the committed handout digest", () => {
  assert.match(RULES, /^[a-f0-9]{64}$/);
  assert.equal(LANGUAGE_RULES_PATH, "docs/release/cli06-06-usability-check/language-rules.md");
  const example = JSON.parse(readFileSync(join(kit, "record-example.json"), "utf8"));
  const exampleEvidence = JSON.parse(readFileSync(join(kit, "example-validated-evidence.json"), "utf8"));
  assert.equal(ValidateObservation(example, VERSION, SUPERREPO, COMPILER, exampleEvidence).thresholds.add_found_within_60s.observed, 4);
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
  mkdirSync(join(root, "scripts/ci"), { recursive: true });
  writeFileSync(join(root, CASE_MANIFEST_PATH), "{\"cases\":[]}\n");
  git(root, "add", "README", CASE_MANIFEST_PATH);
  git(root, "update-index", "--add", "--cacheinfo", `160000,${COMPILER},compiler`);
  git(root, "update-index", "--add", "--cacheinfo", `160000,${DISTRIB},beskid_distrib`);
  git(root, "update-index", "--add", "--cacheinfo", `160000,${BSOL},beskid_bsol`);
  writeFileSync(join(root, "scripts/ci/build-release-artifact.sh"), "echo build\n");
  git(root, "add", "scripts/ci/build-release-artifact.sh");
  git(root, "commit", "-q", "-m", "candidate");
  return { root, candidate: git(root, "rev-parse", "HEAD") };
}
const built = (candidate) => ({ ...evidence, source: { superrepo_commit: candidate, compiler_commit: COMPILER } });
function commit(root, message, change) {
  change(root);
  git(root, "commit", "-q", "--allow-empty", "-m", message);
  return git(root, "rev-parse", "HEAD");
}
function commitRecord(root, value, extra = () => {}) {
  return commit(root, "record", (dir) => {
    mkdirSync(join(dir, "docs/release"), { recursive: true });
    writeFileSync(join(dir, RecordPath(VERSION)), JSON.stringify(value));
    git(dir, "add", RecordPath(VERSION));
    extra(dir);
  });
}
const rootOnly = (dir) => { mkdirSync(join(dir, "scripts/ci"), { recursive: true }); writeFileSync(join(dir, "scripts/ci/gate.sh"), "echo fixed\n"); writeFileSync(join(dir, "README"), "docs\n"); git(dir, "add", "scripts/ci/gate.sh", "README"); };

test("without a record or input the candidate is HEAD", (t) => {
  const { root, candidate } = candidateRepo(t);
  assert.equal(ReleaseSource(root, VERSION, candidate), candidate);
  assert.equal(ReleaseSource(root, "0.7.0", candidate), candidate);
  assert.deepEqual(ReleaseObservation(root, VERSION, candidate, candidate, COMPILER, built(candidate)), ObservationReport(VERSION, null));
  const cli = spawnSync(process.execPath, [script, "--source", root, VERSION, candidate], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.stdout.trim(), candidate);
});
test("root-only commits after the candidate do not force a rebuild", (t) => {
  const { root, candidate } = candidateRepo(t);
  const head = commit(root, "ci and docs", rootOnly);
  assert.equal(ReleaseSource(root, VERSION, head, candidate), candidate, "the gate input names the candidate");
  const report = ReleaseObservation(root, VERSION, head, candidate, COMPILER, built(candidate));
  assert.equal(report.status, "not-performed");
  assert.throws(() => ReleaseObservation(root, VERSION, head, head, COMPILER, built(candidate)), /not the build of the release candidate/);
  const cli = spawnSync(process.execPath, [script, "--source", root, VERSION, head, candidate], { encoding: "utf8" });
  assert.equal(cli.stdout.trim(), candidate, cli.stderr);
});
test("the committed record names the candidate, also after root-only commits", (t) => {
  const { root, candidate } = candidateRepo(t);
  commit(root, "ci", rootOnly);
  const head = commitRecord(root, record({ superrepo_commit: candidate }), (dir) => { writeFileSync(join(dir, "README"), "notes\n"); git(dir, "add", "README"); });
  assert.equal(ReleaseSource(root, VERSION, head), candidate);
  assert.equal(ReleaseSource(root, VERSION, head, candidate), candidate);
  assert.throws(() => ReleaseSource(root, VERSION, head, "c".repeat(40)), /differs from the record's candidate/);
  const report = ReleaseObservation(root, VERSION, head, candidate, COMPILER, built(candidate));
  assert.equal(report.status, "pass");
  assert.equal(report.record.superrepo_commit, candidate);
  assert.throws(() => ReleaseSource(root, VERSION, candidate), /not the release commit/);
});
test("the record's CLI digests are checked against the candidate build", (t) => {
  const { root, candidate } = candidateRepo(t);
  const head = commitRecord(root, record({ superrepo_commit: candidate }));
  assert.throws(() => ReleaseObservation(root, VERSION, head, candidate, COMPILER, evidence), /not the build of the release candidate/);
  const otherCli = built(candidate); otherCli.platforms = otherCli.platforms.map((platform, index) => index ? platform : { ...platform, artifacts: [{ name: platform.release_assets[0], sha256: "e".repeat(64) }] });
  assert.throws(() => ReleaseObservation(root, VERSION, head, candidate, COMPILER, otherCli), /not the validated artifact/);
  assert.throws(() => ReleaseObservation(root, VERSION, head, candidate, "d".repeat(40), built(candidate)), /compiler pointer/);
  const cli = spawnSync(process.execPath, [script, "--release", root, VERSION, head, candidate, COMPILER, join(root, "missing-evidence.json")], { encoding: "utf8" });
  assert.notEqual(cli.status, 0);
});
test("a below-threshold record does not block and a forged record does", (t) => {
  const { root, candidate } = candidateRepo(t);
  const failing = record({ superrepo_commit: candidate }); failing.participants[3].add_found_seconds = 61;
  const head = commitRecord(root, failing);
  writeFileSync(join(root, "evidence.json"), JSON.stringify(built(candidate)));
  const below = spawnSync(process.execPath, [script, "--release", root, VERSION, head, candidate, COMPILER, join(root, "evidence.json")], { encoding: "utf8" });
  assert.equal(below.status, 0, below.stderr);
  assert.equal(JSON.parse(below.stdout).status, "below-threshold");
  const { root: other, candidate: base } = candidateRepo(t);
  const forged = commitRecord(other, record({ superrepo_commit: base, version: "0.6.1" }));
  assert.throws(() => ReleaseObservation(other, VERSION, forged, base, COMPILER, built(base)), /identity mismatch/);
});
test("the candidate must be an ancestor with identical compiler, bsol and manifest identity", (t) => {
  const { root, candidate } = candidateRepo(t);
  const foreign = commitRecord(root, record({ superrepo_commit: "c".repeat(40) }));
  assert.throws(() => ReleaseSource(root, VERSION, foreign), /not a commit of this repository/);
  const { root: side, candidate: sideBase } = candidateRepo(t);
  const branchPoint = git(side, "rev-parse", "HEAD");
  const sibling = commit(side, "sibling", rootOnly);
  git(side, "reset", "-q", "--hard", branchPoint);
  const head = commit(side, "other", (dir) => { writeFileSync(join(dir, "README"), "other\n"); git(dir, "add", "README"); });
  assert.throws(() => ReleaseSource(side, VERSION, head, sibling), /not an ancestor/);
  assert.equal(ReleaseSource(side, VERSION, head, sideBase), sideBase);
  const pointer = (path, sha) => (dir) => git(dir, "update-index", "--cacheinfo", `160000,${sha},${path}`);
  const { root: c1, candidate: k1 } = candidateRepo(t);
  assert.throws(() => ReleaseSource(c1, VERSION, commit(c1, "compiler", pointer("compiler", "d".repeat(40))), k1), /compiler pointer of the release commit differs/);
  // beskid_distrib is packaging identity, not build identity: a release commit may carry a newer one.
  const { root: c2, candidate: k2 } = candidateRepo(t);
  assert.equal(ReleaseSource(c2, VERSION, commit(c2, "distrib", pointer("beskid_distrib", "d".repeat(40))), k2), k2);
  const { root: c3, candidate: k3 } = candidateRepo(t);
  const manifest = commit(c3, "manifest", (dir) => { writeFileSync(join(dir, CASE_MANIFEST_PATH), "{\"cases\":[1]}\n"); git(dir, "add", CASE_MANIFEST_PATH); });
  assert.throws(() => ReleaseSource(c3, VERSION, manifest, k3), /release-case manifest digest/);
  assert.throws(() => ReleaseSource(c3, VERSION, manifest, "not-a-commit"), /40-character commit/);
  assert.ok(candidate);
});
test("the release gate refuses a symlinked or malformed record", (t) => {
  const { root, candidate } = candidateRepo(t);
  writeFileSync(join(root, "real.json"), JSON.stringify(record({ superrepo_commit: candidate })));
  mkdirSync(join(root, "docs/release"), { recursive: true });
  symlinkSync("../../real.json", join(root, RecordPath(VERSION)));
  git(root, "add", RecordPath(VERSION)); git(root, "commit", "-q", "-m", "link");
  assert.throws(() => ReleaseSource(root, VERSION, git(root, "rev-parse", "HEAD")), /regular file/);
  const { root: plain } = candidateRepo(t);
  const bad = commitRecord(plain, { superrepo_commit: 42 });
  assert.throws(() => ReleaseSource(plain, VERSION, bad), /40-character candidate/);
});

test("per-platform sources: C/C/D with only non-build root changes is one build identity", (t) => {
  const { root, candidate } = candidateRepo(t);
  const d = commit(root, "gate changes", (dir) => {
    mkdirSync(join(dir, "openspec/changes/x"), { recursive: true });
    writeFileSync(join(dir, "openspec/changes/x/design.md"), "x\n");
    writeFileSync(join(dir, "scripts/ci/compiler-rust-gate.sh"), "clippy report-only\n");
    writeFileSync(join(dir, "scripts/ci/release-user-observation.mjs"), "// validator\n");
    git(dir, "add", "openspec", "scripts/ci/compiler-rust-gate.sh", "scripts/ci/release-user-observation.mjs");
  });
  const head = commitRecord(root, record({ superrepo_commit: candidate }));
  const resolved = ResolvePlatformSources(root, VERSION, head, "", { linux: d, macos: "", windows: "" });
  assert.deepEqual(resolved.sources, { linux: d, macos: candidate, windows: candidate });
  assert.equal(resolved.candidate, candidate, "the record's candidate carries the build identity");
  assert.deepEqual(resolved.build_identity, BuildIdentity(root, d));
  assert.deepEqual(resolved.build_identity, { compiler_commit: COMPILER, beskid_bsol_commit: BSOL, release_case_manifest_sha256: resolved.build_identity.release_case_manifest_sha256 });
  const cli = spawnSync(process.execPath, [script, "--platform-sources", root, VERSION, head, "", d, "", ""], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(JSON.parse(cli.stdout).sources.linux, d);
});
test("website content is a non-build path for platform sources and packaging roots", (t) => {
  const { root, candidate } = candidateRepo(t);
  const site = commit(root, "blog", (dir) => {
    mkdirSync(join(dir, "site/website/src/content/docs/blog"), { recursive: true });
    writeFileSync(join(dir, "site/website/src/content/docs/blog/v0-6-0-release.md"), "release post\n");
    git(dir, "add", "site");
  });
  assert.ok(NON_BUILD_PATHS.some(pattern => pattern.test("site/website/src/content/docs/blog/v0-6-0-release.md")));
  assert.ok(!NON_BUILD_PATHS.some(pattern => pattern.test("sites/x")) && !NON_BUILD_PATHS.some(pattern => pattern.test("scripts/site/x")), "only the root site/ tree");
  assert.deepEqual(ValidatePackagingRoot(root, candidate, site, site), { source: candidate, packaging_commit: site, distrib_commit: DISTRIB });
  const head = commitRecord(root, record({ superrepo_commit: candidate }));
  assert.deepEqual(ResolvePlatformSources(root, VERSION, head, "", { linux: site }).sources, { linux: site, macos: candidate, windows: candidate });
});
test("per-platform sources: a build script change is refused", (t) => {
  const { root, candidate } = candidateRepo(t);
  const d = commit(root, "build change", (dir) => { writeFileSync(join(dir, "scripts/ci/build-release-artifact.sh"), "echo other\n"); git(dir, "add", "scripts/ci/build-release-artifact.sh"); });
  assert.throws(() => ResolvePlatformSources(root, VERSION, d, candidate, { linux: d }), /changes build inputs relative to candidate .*: scripts\/ci\/build-release-artifact\.sh/);
  const workflow = commit(root, "linux workflow", (dir) => { mkdirSync(join(dir, ".woodpecker"), { recursive: true }); writeFileSync(join(dir, ".woodpecker/linux.yml"), "steps: {}\n"); git(dir, "add", ".woodpecker/linux.yml"); });
  assert.throws(() => ResolvePlatformSources(root, VERSION, workflow, candidate, { linux: workflow }), /\.woodpecker\/linux\.yml/);
});
test("per-platform sources: a differing compiler pointer is refused", (t) => {
  const { root, candidate } = candidateRepo(t);
  const d = commit(root, "compiler", (dir) => git(dir, "update-index", "--cacheinfo", `160000,${"d".repeat(40)},compiler`));
  const head = commit(root, "revert compiler", (dir) => git(dir, "update-index", "--cacheinfo", `160000,${COMPILER},compiler`));
  assert.throws(() => ResolvePlatformSources(root, VERSION, head, candidate, { linux: d }), /compiler pointer of the linux source .* differs from candidate/);
  const bsol = commit(root, "bsol", (dir) => git(dir, "update-index", "--cacheinfo", `160000,${"d".repeat(40)},beskid_bsol`));
  assert.throws(() => ResolvePlatformSources(root, VERSION, bsol, candidate), /beskid_bsol pointer of the release commit differs/);
});

// Repackaging: a packaging root P packages the outputs of build source C.
test("packaging root: the build source packages itself with its own distrib", (t) => {
  const { root, candidate } = candidateRepo(t);
  const head = commit(root, "docs", rootOnly);
  assert.deepEqual(ValidatePackagingRoot(root, candidate, candidate, head), { source: candidate, packaging_commit: candidate, distrib_commit: DISTRIB });
});
test("packaging root: a descendant changing only packaging scripts and distrib is accepted", (t) => {
  const { root, candidate } = candidateRepo(t);
  const newDistrib = "e".repeat(40);
  const p = commit(root, "repackage", (dir) => {
    mkdirSync(join(dir, "scripts/ci/lib"), { recursive: true });
    writeFileSync(join(dir, "scripts/ci/woodpecker-package-platform.mjs"), "// prune caches\n");
    writeFileSync(join(dir, "scripts/ci/lib/bundle-caches.mjs"), "// caches\n");
    git(dir, "add", "scripts/ci");
    git(dir, "update-index", "--cacheinfo", `160000,${newDistrib},beskid_distrib`);
  });
  assert.deepEqual(ValidatePackagingRoot(root, candidate, p, p), { source: candidate, packaging_commit: p, distrib_commit: newDistrib });
  for (const pattern of REPACKAGE_ALLOWED_PATHS) assert.ok(!NON_BUILD_PATHS.some(other => String(other) === String(pattern)), `${pattern} is a separate repackage set`);
  assert.ok(!NON_BUILD_PATHS.some(pattern => pattern.test("beskid_distrib")), "beskid_distrib is not a non-build path");
  const cli = spawnSync(process.execPath, [script, "--packaging-root", root, candidate, p, p], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(JSON.parse(cli.stdout).distrib_commit, newDistrib);
  // A per-platform build source may still not differ in distrib.
  assert.throws(() => ResolvePlatformSources(root, VERSION, p, candidate, { linux: p }), /changes build inputs relative to candidate .*: beskid_distrib/);
});
test("packaging root: build inputs, compiler drift, foreign history and non-ancestors are refused", (t) => {
  const { root, candidate } = candidateRepo(t);
  const build = commit(root, "build script", (dir) => { writeFileSync(join(dir, "scripts/ci/build-release-artifact.sh"), "echo other\n"); git(dir, "add", "scripts/ci/build-release-artifact.sh"); });
  assert.throws(() => ValidatePackagingRoot(root, candidate, build, build), /changes inputs other than packaging .*scripts\/ci\/build-release-artifact\.sh/);
  const { root: r2, candidate: c2 } = candidateRepo(t);
  const compiler = commit(r2, "compiler", (dir) => git(dir, "update-index", "--cacheinfo", `160000,${"d".repeat(40)},compiler`));
  assert.throws(() => ValidatePackagingRoot(r2, c2, compiler, compiler), /compiler pointer of the packaging root/);
  const { root: r3, candidate: c3 } = candidateRepo(t);
  const later = commit(r3, "docs", rootOnly);
  assert.throws(() => ValidatePackagingRoot(r3, later, c3, later), /does not descend from the build source/);
  assert.throws(() => ValidatePackagingRoot(r3, c3, later, c3), /not HEAD or an ancestor of HEAD/);
  assert.throws(() => ValidatePackagingRoot(r3, "f".repeat(40), later, later), /not a commit of this repository/);
});

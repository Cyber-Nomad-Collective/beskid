# Review of the 0.6.0 release case binding plan

Date: 2026-10-13. Read-only review of
`docs/reports/2026-10-13-v06-release-case-binding-plan.md` against
`scripts/ci/release-cases-v06.json`, `scripts/ci/woodpecker-release-evidence.mjs`,
`scripts/ci/woodpecker-build-platform.sh`, `scripts/ci/release-publication-eligibility.mjs`
and `scripts/ci/windows-installer-owner-waiver.mjs` in the worktree
`/Users/mikserek/.codex/worktrees/v06-release/beskid` (compiler `2192c1e9`,
`release/v0.6.0`, with uncommitted Glue cleanup). No builds or tests were run.

## Summary

The plan is sound in structure and its seven reader corrections are real.
Four findings change what must land before the freeze:

1. The `installed_host_harness` kind is not yet closed against passing without
   the installed toolchain. The precedent harness it cites reaches the source
   checkout through compile-time paths, and the reader would accept an
   environment variable as proof of use. A proof-of-invocation line in retained
   output, re-parsed by the reader, closes it cheaply.
2. The reader has a vacuous-pass path the corrections do not list: the row's
   executed test list and its retained log are producer-authored and
   self-referential. Nothing ties them to the raw test report. The schema-1
   reader parsed the raw report; the schema-2 reader must again.
3. Two conditions in the current reader fail on any real evidence directory
   and are not in the correction table: the installed CLI receipt path must be
   flat, and the platform directory must contain only checksummed files while
   the build script writes four unchecksummed logs into it.
4. Several host cells list library-level tests as required ids. Those tests
   never touch the prefix. They should be related evidence, not required.

The CLI06-06 observation record is honest if it is labelled an attestation,
retains transcripts, and blocks publication when it fails. It should not be
turned into a waiver by default, but the waiver path must exist in writing.

## 1. Is `installed_host_harness` sound and faithful to the policy?

The policy fields are `installed_prefix_only: true` and
`assertion_bindings_must_exist_in_consumed_source: true`
(`release-cases-v06.json` lines 11 to 18). The plan preserves the second
through source provenance spans. The first is preserved by intent but not by
mechanism.

### 1.1 The precedent leaks the checkout

The plan cites `glue_owned.rs` as the model that "runs only the installed CLI
and never the build-tree binary". It does call `<prefix>/bin/beskid`
(`installed_cli`, line 1282), but it also:

- resolves fixtures and the build-tree corelib through
  `env!("CARGO_MANIFEST_DIR")` at lines 238, 242, 489, 585 and 1345;
- sets the corelib root override to the checkout's `compiler/corelib` on every
  installed build (`run_installed_build`, lines 1345 to 1356), so the installed
  CLI compiles against source corelib, not the bundled one.

On the release builder both the checkout and `target/<T>/release/beskid` exist
when the harness runs (`build-release-artifact.sh` line 93 builds the CLI
there). A harness compiled on that machine carries those paths and will use
them silently. "Installed prefix only" is therefore a code-review property
today, and the precedent itself violates it.

### 1.2 The reader accepts a claim, not a proof

The plan's reader check for the host kind is
`row.command.env.BESKID_V06_QUALIFIED_PREFIX === installed.prefix`. The row is
written by the producer. A harness that ignores the variable passes.

### 1.3 Remedy: proof of invocation, re-parsed

- The harness crates get one `installed::Cli` helper. It panics if
  `BESKID_V06_QUALIFIED_PREFIX` is absent, if `BESKID_CORELIB_ROOT` or
  `BESKID_RUNTIME_PREFIX` is set, or if it is asked for a path derived from
  `CARGO_MANIFEST_DIR`. Fixtures come only from the packet `input` archive the
  plan already defines.
- On every installed invocation the helper writes one line to stderr:
  `beskid-installed-invocation sha256=<cli digest> argv0=<path>`.
- The producer marks a test `not_executed` when its retained stderr has no such
  line. The reader re-parses retained stderr, requires at least one line per
  required id, and checks `sha256 === expected.candidate_cli_sha256` and
  `argv0` under `installed.prefix`.
- A matrix test asserts that neither harness crate lists `beskid_cli` as a
  dependency, so `CARGO_BIN_EXE_beskid_cli` cannot exist.

### 1.4 Rust declaration grammar

The proposed rule (`fn <id>(` at line start, preceding line exactly `#[test]`)
rejects every test inside an indented `mod tests` block and accepts a
`#[cfg(any())]`-gated declaration that never compiles. Allow equal leading
whitespace on both lines, reject any attribute between `#[test]` and `fn`
(`#[ignore]`, `#[should_panic]`), and rely on the retained libtest stdout
(`running 1 test`) to prove execution, as in section 2.

## 2. Are the seven reader corrections complete?

The seven in section 3.2 of the plan are correct. Line numbers below refer to
`woodpecker-release-evidence.mjs` as checked in. These are missing:

### 2.1 Self-referential executed test list (vacuous pass)

Lines 334 to 340: `row.tests` must all be `passed` and equal
`required_test_ids`; then the retained `case-<id>.json` is parsed and compared
to the row itself. The row and its log are both producer output. No check
reads the `beskid test --json` report the schema-1 reader parsed at lines 384
to 406 (summary counts, every outcome, passed ids equal claimed ids).

This interacts with the plan's subset correction. `CoreSuite` holds 93 tests
(`src/core/CoreSuite.bd`) and `foundations.core_bytes` requires 10. Under the
current exact-equality rule a producer passes only by filtering `row.tests` to
the 10, which is exactly the unverifiable path. The subset rule is right, but
only if the reader derives the executed set itself:

- Native kind: retained stdout is the raw `--json` report. The reader parses
  it, requires `summary` to match the `tests[]` outcomes, requires zero
  `failed`, `skipped`, `filtered_out` or `timed_out` anywhere in the target,
  and requires `required_test_ids` to be a subset of the passed names.
- Rust kind: retained stdout is raw libtest text. The reader requires
  `running 1 test`, `test <id> ... ok` and
  `test result: ok. 1 passed; 0 failed; 0 ignored` for each required id.
- `row.tests` becomes a derived convenience that must equal the derived set,
  or is dropped.

### 2.2 Installed CLI receipt path cannot be real

Line 278: `join(installed.prefix, packetName(installed.cli.path))` must equal
`expected.installed_cli`, and line 280 requires `installed.cli` to be a packet
file. `packetName` rejects `/`. The installed CLI is `<prefix>/bin/beskid`
(`woodpecker-build-platform.sh` line 112), so `bin/beskid` fails `packetName`,
and a flat name is not the path the harness ran. The same applies to
`row.command.tool_file` at line 349.

Correction: the receipt stores `cli.relative_path` (`bin/beskid`, validated as
a confined relative path with no `..` or absolute segment) and
`cli.packet_copy` (a flat packet file holding the same bytes). The reader
compares `installed_cli` by path segments, not by `join`, because the
aggregation host is Linux and the Windows producer writes backslashes.

### 2.3 Unchecksummed logs break packet closure

Line 230 requires `readdirSync(packet_root)` minus `SHA256SUMS` to equal the
checksummed names. `woodpecker-build-platform.sh` writes
`artifact-version-smoke.log` (line 110), `bundle-contents.log` (line 118),
`cli-surface-corelib-verify.log` (line 176) and `cli-surface-gate.log`
(line 183) into the output directory and does not list them at lines 196 to
209. Every schema-2 validation of a real directory fails at "retained packet
file closure". Either checksum every file the script writes or write logs to
a sibling directory.

### 2.4 Schema dispatch by file presence

Line 437 selects schema 2 when `feature-evidence-v2.json` exists. For a 0.6
version the schema-1 branch fails in every case (lines 410 and 418 contradict
each other for Glue), which is fail-closed but by accident. State it: a
version in `0.6.` requires schema 2 and rejects `feature-evidence-v1.json` as
an undeclared artifact.

### 2.5 Smaller gaps

- No `exactKeys` on schema-2 rows, manifest cases or bindings; unknown fields
  pass silently. The schema-1 reader key-checked every object.
- `expected.installed_cli` and `runtime_abi_sha256` come from
  `woodpecker-build-result.json`, which schema 2 does not key-check.
- `row.command.version` is required (line 345) but undefined for a harness.
  Define it as the harness packet digest.
- `expectedArtifacts` for schema 2 (line 450) must include
  `target_packet_files[target]`; the plan's table implies it but the text of
  section 3.3 lists it only on the manifest side.
- `objectDigest(manifest)` hashes `JSON.stringify` of the parsed object, so the
  frozen digest depends on key order in the file. The freeze tool must write
  canonical JSON and the matrix test must assert that reformatting fails.

## 3. Is the CLI06-06 observation record honest?

Honest as an attestation, not as evidence. The validator can check shape,
counts and thresholds; it cannot check that five people existed, were
uncoached, or saw only the help. That is the same epistemic status as
`windows-installer-owner-waiver.mjs`, whose header already says "a decision
record, not VM attestation". The plan's design is better than a bare waiver
because it records what was observed, and it should stay, with four changes:

1. Name it an attestation in the spec scenario and in `release-state.json`
   (`verification: "observer-attested"`), so a reader of the release record is
   not told it was machine-verified.
2. Retain one transcript per participant: the command list with timestamps and
   the `beskid --version` output, so the `candidate_cli_sha256` claim is
   grounded in something the participant actually ran.
3. A failing record blocks publication. "Recorded per candidate" is not enough
   if the threshold is a SHALL.
4. Write the waiver fallback into the same change with an expiry: if five
   participants cannot be found, the owner records an unmet SHALL and a dated
   obligation for 0.6.1. The project has no users yet; a record that looks
   complete but was produced under pressure is worse than a waiver that says
   what was skipped.

## 4. Dispositions I would change

| Case | Plan | Change | Reason |
| --- | --- | --- | --- |
| SER-04 | (c), required ids include two library-level arena tests | Required ids are the two installed tests only; arena tests become `related_evidence` | Library tests pass with no prefix; see 1.3 |
| MOD-06-02 | (c), five arena tests plus one installed test | Required id is the installed test; the five stay in `beskid_analysis` tests as related evidence | Same |
| MOD-06-01 | (c), includes four `native_mod_dispatch_v06.rs` library ports | Same split | Same |
| R4-BIND-01, R4-BIND-02 | (c), library-level ports plus one installed comparison | Required ids are the installed comparisons; ports are related evidence | Same |
| SER-01 | (b) on `SerializationGeneratedSuite` plus three ids from `SerializationModGenerationTests` | One target per native case; move the three into the new suite or make them related evidence | A native binding names one `target` |
| BSOL-06-03, BSOL-06-06, SER-03 | "or" between two targets | Decide before the fragments are written | The freeze tool cannot choose |
| CLI06-06 | (c) scripted half, (d) observation | Keep, with the four conditions of section 3 | |
| R4-IO-01..12, R4-GEN-04..06 | (e) provisional | Agree | Matches the spec split |
| DEP06-05 | (c), in-process transaction then installed `check` | Keep | Ends in an installed invocation, so 1.3 is satisfied |
| R4-PROC-01..06 | (b) native with a Rust fixture child | Keep; add a matrix check that `beskid test` forwards `BESKID_V06_RELEASE_FIXTURE` to the test process | Otherwise every cell is RED for the wrong reason |

## 5. Freeze checklist additions

Add to section 9 of the plan, before item 5:

- The reader derives executed outcomes from retained raw output (2.1) and
  proof-of-invocation lines (1.3); RED tests: filtered `row.tests` with a
  failed test in the target rejects; a host cell with no invocation line
  rejects; an invocation line with a foreign digest rejects.
- Receipt path and packet-closure corrections (2.2, 2.3) land with a test that
  runs the schema-2 reader over a directory produced by
  `woodpecker-build-platform.sh` in the CI test shell, not only over the
  synthetic fixture.
- Both harness crates compile with no `CARGO_MANIFEST_DIR` use and no
  `beskid_cli` dependency, asserted by a matrix test that greps the crate
  sources and parses `Cargo.toml`.

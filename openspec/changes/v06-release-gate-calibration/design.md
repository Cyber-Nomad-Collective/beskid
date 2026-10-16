## Context

The 0.6 release program made every gate fail closed. For gates that protect the shipped bytes this is correct. For gates that encode a process preference, it blocks releases without a matching risk. The release owner approved this recalibration on 2026-10-15. Builds #334 (Linux) and #335 (Windows) of candidate `9a8cdc68` were running at that time; the changes here are root-only commits on top of that candidate and do not invalidate its builds under the new rule.

## Principle

A release gate is kept fail-closed when it protects one of these:

1. the identity of the artifacts that ship (source, compiler, distribution and case-manifest identity, checksums);
2. the observable behavior of those artifacts (release cases run on installed artifacts);
3. the authority to publish (main-only lane, scoped token);
4. the integrity of the build inputs (workspace-mutation guard, tamper checks of runtime kits and Mods).

A gate that records a quality target without users to measure is published, not blocking. A gate that duplicates a stronger gate, or that inspects source text instead of behavior, is removed or simplified.

## Gate inventory

| Gate | Where | Purpose | Cost | Verdict |
|---|---|---|---|---|
| Release cases on installed artifacts (86 mandatory cases, `installed_native` and `installed_host_harness`) | `woodpecker-release-cases-v06.mjs`, `woodpecker-release-evidence.mjs` | Proves the shipped CLI, runtime kit and Corelib behave as specified on all three targets | High (native runs on three workers) | Keep |
| Per-platform handoff checksums and identity (`SHA256SUMS`, `UPLOAD_COMPLETE`, capsule) | `woodpecker-handoff.mjs`, `woodpecker-fetch-handoffs.sh` | The release consumes exactly the bytes that were built and tested | Low | Keep |
| Aggregate source identity (one superrepo and compiler commit across all platforms) | `woodpecker-aggregate-release.mjs` | No mixed candidates | Low | Keep |
| Release commit equals candidate plus exactly one file | `release-user-observation.mjs` `CommittedCandidate` | Ensured the record commit could not change artifacts | High (any later root commit forced a three-platform rebuild) | Simplify: C is an ancestor of HEAD with HEAD's build identity (`compiler`, `beskid_bsol` and `beskid_distrib` gitlinks, release-case manifest digest) |
| One source commit for all three handoffs | `woodpecker-fetch-handoffs.sh`, `woodpecker-aggregate-release.mjs` | One coherent candidate | High (a Linux-only gate change forced Windows and macOS rebuilds) | Simplify: per-platform sources may differ from C only in non-build root paths and must share C's build identity |
| Gate failure stops the Linux build before packaging and upload | `.woodpecker/linux.yml` | A failed gate must not publish | Hides built artifacts; forces a rebuild after a gate-only fix | Reorder in 0.6.1 (D5): package and upload always, fail the step afterwards |
| CLI06-06 observation record (five uncoached users) | `release-user-observation.mjs` `--release` | Usability target for beginners | High (five fresh participants per candidate); no users exist yet | Non-blocking: a committed record is validated strictly and an invalid or forged record fails; the result (`pass`, `below-threshold`, `not-performed`) is published in the release state and notes |
| CLI06-06 owner waiver (0.6.0 only) | `release-user-observation.mjs` | Allowed release without the observation | Low | Drop: a missing record no longer blocks |
| CLI06-06 scripted journeys (`cli06_06_*` installed harness cases) | release cases | Proves the beginner journey works on installed artifacts | Part of the case run | Keep |
| Legacy type-system text search (`legacy_patterns`) | `compiler-rust-gate.sh` `run_lint_phase` | Prevented retired names from returning | Low per run, but produced the #325 false positive | Drop: clippy, the type checker and the tests guard behavior |
| Clippy with `-D warnings` | `compiler-rust-gate.sh` | Lint quality of compiler sources | Medium; on candidate `9a8cdc68` three lint findings in `beskid_execution` stopped Linux #334 after 86/86 cases and Corelib 33/33 passed, before packaging and upload | Lint, non-blocking for release: report-only, findings logged with a count |
| Compiler workspace tests and runtime-kit staging | `compiler-rust-gate.sh` | Behavior of the compiler | High | Keep |
| Corelib gate | `corelib-gate.sh` | Behavior of Corelib on the candidate | Medium | Keep |
| Workspace-mutation guard and pinned-source checks | `woodpecker-release-gates.sh`, `release-source-inventory.sh` | The gates ran on the pinned, unmodified checkout | Low | Keep |
| Runtime-kit and Mod tamper checks (exact installed prefix, digests) | compiler and runtime-kit validators | Fail closed on missing, mismatched or tampered kits and Mods | Low | Keep |
| Duplicate manifest digest pin `V06_CASE_MANIFEST_SHA256` | `woodpecker-release-evidence.mjs` | Second copy of the frozen manifest identity | Each binding change needs a second manual edit | Simplify in 0.6.1: CI recomputes the digest and compares it with the committed manifest |
| CLI surface gate (exact help prose) | `woodpecker-cli-surface-evidence.mjs` | Command surface stays stable | Every wording change breaks the gate | Simplify in 0.6.1: check exit codes, JSON and command presence |
| Windows installer owner waiver | `woodpecker-release.sh`, `windows-installer-owner-waiver.mjs` | Allowed publication without the disposable-VM smoke matrix | One manual record per release | Simplify in 0.6.1: require it only for an unsigned installer or a declared known gap |
| Main-only `release-publish` lane with the scoped `compiler_release_token` | `.woodpecker/release.yml` on `main` | Only reviewed `main` publishes; only the final step holds the secret | Low | Keep |
| Immutable remote asset comparison | `woodpecker-release.sh`, `publish-release-stream.sh` | Never overwrite published bytes | Low | Keep |
| Corelib publisher hard-coded member list | `corelib-publish-runner.mjs` | Classified every workspace member | Every new member failed the publisher (14 unlisted in 0.6) | Simplify: derive from `CoreLib.bws` with an explicit exclusion list |
| Corelib publisher hard-coded `patch` bump | `.woodpecker/pckg.yml`, `corelib-publish.sh` | Version policy | A minor or exact release needed a script edit | Simplify: pipeline input `BESKID_PCKG_VERSION_BUMP` |

## Decisions

### D1. Candidate rule

The release runs on HEAD. The candidate C is resolved in this order:

1. If `docs/release/cli06-06-record-v<version>.json` is committed in HEAD, C is its `superrepo_commit`. The file must be a regular file and valid JSON with a 40-character commit, and it cannot name HEAD itself.
2. Else, if the gate input `BESKID_RELEASE_CANDIDATE` is set, C is that commit.
3. Else, C is HEAD.

If both the record and the input name a candidate, they must be equal. Then:

- C is a commit and an ancestor of HEAD, or HEAD.
- `git rev-parse C:compiler` equals `HEAD:compiler`, and `C:beskid_distrib` equals `HEAD:beskid_distrib`.
- The sha256 of `scripts/ci/release-cases-v06.json` at C equals its sha256 at HEAD (both absent is also equal).

The release fetches the handoffs keyed by C, verifies their checksums and builds the release state with C as `provenance.superrepo_commit`. Any root-only commit between C and HEAD is allowed: CI scripts, documentation, the record and these gate changes. Every input that determines the artifacts (compiler, distribution packaging and the case manifest) is identical, and the artifacts themselves are the checksum-verified builds of C. The other root submodules (editors, sites, templates) do not enter the released compiler artifacts.

The release scripts that run are the scripts at HEAD, not at C. This is intended: the gate scripts are not artifacts, and fixing a release script must not force a rebuild.

### D1a. Per-platform sources and build identity

The build identity of a root commit is its `compiler`, `beskid_bsol` and `beskid_distrib` gitlinks and the sha256 of `scripts/ci/release-cases-v06.json`. Corelib is a gitlink inside the compiler commit, so the compiler pointer fixes it. `beskid_bsol` is a build input: the compiler workspace resolves its `../beskid_bsol` path dependency, and the build initializes it.

A platform handoff may come from its own source P (`BESKID_LINUX_SOURCE`, `BESKID_MACOS_SOURCE`, `BESKID_WINDOWS_SOURCE`; default C) when:

- P is HEAD or an ancestor of HEAD;
- P has C's build identity;
- every path in the root diff C..P matches `NON_BUILD_PATHS` in `release-user-observation.mjs`;
- at least one platform source is C, so the release source identity is a built commit.

If every source differs from C only in non-build paths, any two sources differ only in non-build paths, so the pairwise rule follows from the rule against C.

`NON_BUILD_PATHS` is an allowlist; every other path must be identical. It holds `openspec/**`, `docs/**`, `CHANGELOG.md`, `.woodpecker/release.yml`, `.woodpecker/pckg.yml`, `scripts/ci/test/**`, the gate scripts `compiler-rust-gate.sh` and `woodpecker-release-gates.sh` (they write gate reports, never artifacts), and the scripts that run only after the builds: `release-user-observation.mjs`, `woodpecker-release.sh`, `woodpecker-fetch-handoffs.sh`, `woodpecker-aggregate-release.mjs`, `build-release-state.sh`, `render-compiler-release-notes.sh`, `publish-release-stream.sh`, `publish-homebrew-formula.sh`, `corelib-publish.sh` and `lib/corelib-publish-runner.mjs`. Not in the allowlist, because a build step executes them: the per-platform workflows (`.woodpecker/linux.yml`, `macos.yml`, `windows.yml`), `woodpecker-build-platform.sh`, `woodpecker-build-windows.sh`, `build-release-platform.sh`, `build-release-artifact.sh`, `woodpecker-package-platform.mjs`, `woodpecker-release-evidence.mjs` (the packager runs it), `woodpecker-feature-evidence.mjs`, `woodpecker-release-cases-v06.mjs`, `release-case-common.mjs`, `woodpecker-cli-surface-evidence.mjs`, `woodpecker-upload-handoff.sh`, `woodpecker-handoff.mjs`, `init-submodules.sh`, `release-version.mjs` and `verify-release-corelib-bundle.mjs`.

The collector fetches each platform's handoff under its own source. The aggregate validates each platform's evidence against its own source, requires one compiler commit and version, and reports the candidate as the release source. Gate reports carry the Linux source. The release state records `provenance.superrepo_commit` (C), `platform_sources` and `build_identity`. The CLI06-06 record names C, and C has the build identity by definition.

For 0.6.0: Windows #335 and macOS #336 are builds of C = `9a8cdc68`. Linux is rebuilt on D = C plus these gate changes; D touches only allowlisted paths.

### D2. CLI06-06 evidence

`release-user-observation.mjs --release` prints an observation report and exits 0 for all three outcomes:

```json
{
  "schema_version": 1,
  "requirement": "CLI06-06",
  "blocking": false,
  "status": "pass | below-threshold | not-performed",
  "summary": "CLI06-06 observation: ...",
  "record_path": "docs/release/cli06-06-record-v<version>.json",
  "thresholds": { "add_found_within_60s": { "observed": 4, "required": 4, "met": true }, "journey_within_300s": { ... } },
  "record": { ... } 
}
```

`thresholds` and `record` are `null` when no record is committed. The summary is exactly `CLI06-06 observation: not performed`, `CLI06-06 observation: passed (...)` or `CLI06-06 observation: below threshold (...)`. The report is stored in `release-state.json` as `user_observation`, and `render-compiler-release-notes.sh` prints the summary in a "CLI06-06 user observation" section. A record that fails shape, identity, CLI digest, handout digest or transcript checks exits 1 and blocks the release.

### D3a. Clippy is lint, non-blocking for release

The release gate runs clippy report-only: `compiler-rust-gate.sh` logs every finding and the count (`clippy findings: N`) and does not fail on them. Runtime-kit staging and the workspace tests stay blocking. Push CI has no separate clippy check; none is added.

### D5. Gate order in the Linux build (0.6.1)

Today `.woodpecker/linux.yml` runs `woodpecker-release-gates.sh` after the native build and before packaging and `woodpecker-upload-handoff.sh`. A failed gate exits the step, so the built and tested artifacts are not packaged or uploaded. The correct order is: build, gates with the exit status captured, packaging, upload, then exit with the gate status. A failed gate still blocks publication, because the aggregate requires gate reports with `status: "success"` and `exit_code: 0` (`build-release-state.sh` sets `publishable: false` otherwise), but the artifacts stay available for inspection, and a gate-only fix does not need a rebuild of the artifacts. This change edits `.woodpecker/linux.yml`, a build input, so it is deferred to 0.6.1: in 0.6.0 the Linux rebuild D must keep C's build steps. With clippy report-only, the trigger of #334 is gone.

### D3. Legacy grep

The grep loop is deleted. `compiler-rust-gate-timeout.test.sh` asserts that the lint phase passes on sources that contain the retired names and still runs clippy, and that the script has no `legacy_patterns` list.

### D4. Corelib publish set

The publisher parses every `member "<id>" { ... }` block of `CoreLib.bws`. The publish set is all members minus `EXCLUDED_CORELIB_MEMBERS`:

| Member | Reason |
|---|---|
| `corelib_tests` | Test project (`category = "Test"`), the workspace `defaultTestMember`; consumers never depend on it. |
| `corelib_pest_gen` | Development Mod that generates Pest parsers inside the Corelib repository; no published package depends on it. |
| `pest_gen_schema` | BSOL schema of `corelib_pest_gen` tunables; it exists only for that development Mod. |

An exclusion that names no workspace member fails, so the list cannot go stale. Every published member must have complete metadata (`path`, `package`, `description`, `category = "Library"`). A readme is optional, as it is for `beskid pckg pack`; a declared readme must exist. Packages are packed and uploaded in dependency order, the aggregate last. A new member is published automatically, or fails with an exact metadata message.

Mods: `serialization_mod` is published. `corelib_serialization` declares a dependency on it, the aggregate depends on `corelib_serialization`, and the publication plan requires every dependency of a published package to be in the plan. A Mod is an ordinary registry package to its consumer; the existing design excluded only the development generator `corelib_pest_gen`. The aggregate check now compares the aggregate's dependencies with the published library members (members whose project `type` is neither `Aggregate` nor `Mod`), so Mods are published as dependencies, not as aggregate members.

Version policy: `BESKID_PCKG_VERSION_BUMP` is `patch` (default), `minor`, `major` or an exact `MAJOR.MINOR.PATCH`. An exact version applies to every package and must be greater than the latest registry version of each existing package, or the run fails before any registry mutation. `corelib-publish.sh` no longer takes a positional bump; `.woodpecker/pckg.yml` passes the pipeline variable through.

Merge note: unpushed commits `074fa514` (API docs derived from project type plus an explicit failure list) and `bbd96449` (`--libraries-only`) on `main` touch the same runner. This change keeps both intents: the derivation does not decide API docs, and libraries-only remains a filter on the derived plan. The merge needs a manual resolution only in the member constants and the aggregate check.

## Risks

- A forged record (wrong candidate, wrong digests) still fails closed, so publishing the observation as non-blocking cannot be used to ship other bytes.
- A release script fix between C and HEAD runs against C's artifacts. This is the purpose of the rule; the scripts carry their own tests.
- Deriving the Corelib set publishes a new member on the next run. A member that must stay private needs an exclusion entry with a reason.

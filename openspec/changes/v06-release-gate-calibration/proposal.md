## Why

The 0.6 release gates apply fail-closed checks to every rule, including rules that express a process preference rather than a property of the shipped artifacts. These checks cost builds and time and they protect nothing that the checksum and provenance chain does not already protect. The release owner approved a recalibration on 2026-10-15. Three examples show the problem:

- **#325 false positive.** The compiler gate searched compiler sources for retired type-system names. The pattern `TypeContext` matched inside `ExpectedTypeContext`, and the Linux release gate failed on candidate #325 although no retired name was present. Clippy, the type checker and the test suite are the real guards; a text search adds only false positives.
- **Forced rebuild.** The CLI06-06 rule required that the release commit differs from the candidate by exactly one file, the observation record. A merge into `main`, a CI script fix or a documentation change after the candidate froze made the candidate unreleasable and forced a full three-platform rebuild, although the artifacts were unchanged.
- **14 unlisted Corelib packages.** The Corelib publisher held a hard-coded member list. The Corelib workspace grew to 27 members; 14 members (the serialization, BSOL, URI and network-protocol packages, and `serialization_mod`) were in no list, and the publisher failed closed instead of publishing them.

In addition, CLI06-06 (five uncoached users) blocks publication although Beskid has no users yet. The observation is a quality target. It is useful to publish its result, but a missing observation must not hold a release.

## What Changes

- **Candidate rule.** The release runs on HEAD. The candidate C, named by the committed CLI06-06 record or by the gate input `BESKID_RELEASE_CANDIDATE`, defaults to HEAD. C must be an ancestor of HEAD (or HEAD). The `compiler` and `beskid_distrib` gitlinks and the release-case manifest digest of HEAD must equal those of C. The release publishes the checksum-verified per-platform builds of C with C as the source identity. Root-only commits between C and HEAD are allowed. The "exactly one changed file" rule is removed.
- **CLI06-06 is non-blocking.** A committed record is validated strictly (shape, candidate identity, CLI digests, handout digest) and an invalid or forged record fails closed. A missing record or a record below a threshold does not block publication. The release state and the release notes state the result: `pass`, `below-threshold` or `not-performed`. The 0.6.0-only owner waiver is removed, because a missing record no longer blocks.
- **Legacy grep removed.** The `legacy_patterns` text search is removed from the compiler gate lint phase. Clippy with denied warnings stays.
- **Corelib publish set is derived.** The publisher reads the members of `CoreLib.bws` and publishes every member except an explicit, commented exclusion list. A new member is published without a script change. The version policy is the pipeline input `BESKID_PCKG_VERSION_BUMP` (`patch`, `minor`, `major` or an exact version; default `patch`).
- **Deferred to 0.6.1 (tasks only).** Remove the duplicate manifest digest pin in `woodpecker-release-evidence.mjs`; make the CLI surface gate check exit codes, JSON and command presence instead of exact prose; require the Windows installer owner waiver only for an unsigned installer or a declared known gap.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `community--spec-maintenance--release-and-versioning-policy`: candidate-bound release source, gate calibration and derived Corelib publication.
- `tooling--cli--command-surface`: the requirement "Installed beginner workflow acceptance" and scenario `CLI06-06-OBS` are edited in place in the unarchived change `v06-cli-dependencies`, which owns them.

## Impact

Affected files: `scripts/ci/release-user-observation.mjs`, `scripts/ci/woodpecker-release.sh`, `scripts/ci/render-compiler-release-notes.sh`, `.woodpecker/release.yml`, `.woodpecker/pckg.yml`, `scripts/ci/compiler-rust-gate.sh`, `scripts/ci/corelib-publish.sh`, `scripts/ci/lib/corelib-publish-runner.mjs`, `docs/release/cli06-06-usability-check/README.md` and their tests in `scripts/ci/test/`.

Unchanged: the release cases on installed artifacts, the checksum and provenance chain from per-platform handoffs to the release state, the manual `main`-only publish lane with a scoped token, the workspace-mutation guard and the tamper and fail-closed checks of runtime kits and Mods.

Compatibility: there are no users, so no compatibility path is kept. The positional bump argument of `corelib-publish.sh` and the CLI06-06 owner waiver are removed. Reversion: revert the commits of this change; no published artifact depends on them.

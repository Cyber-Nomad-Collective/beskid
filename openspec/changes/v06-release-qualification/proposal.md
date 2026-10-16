## Why

Previous releases mixed source revisions, partial feature delivery, packaging availability and publication readiness. beskid 0.6.0 needs one source-bound acceptance packet covering its whole scope, with bounded failure recovery and public artifact readback.

## What Changes

- Require native Linux x64, macOS arm64 and Windows x64 behavior and installed-consumer evidence for everyday CLI, generic serialization, checked dynamic, full native BSOL and Rust Glue.
- Retain existing foundations/network/HTTP regression obligations and validate mandatory case completeness, not only successful commands.
- Freeze source and artifact identity before qualification; reuse valid evidence only when its consumed inputs are unchanged.
- Separate build qualification, reviewed manual publication, per-channel availability and Tracker closure; prevent inherited waivers and partial feature claims.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compiler--conformance--conformance-evidence-policy`: mandatory release matrix and source-bound acceptance.
- `community--spec-maintenance--release-and-versioning-policy`: bounded release loop and immutable publication/readback closure.

## Impact

The existing Woodpecker evidence producers/readers and external manual publisher remain the implementation authority. Tracker remains delivery authority; OpenSpec remains normative authority. Existing historical release records stay immutable. .NET Glue remains stretch. No new package channels or deployment system are introduced.

Compatibility: stronger 0.6 qualification does not retroactively invalidate earlier releases or their retained evidence. CLI migrations are specified by the dependency change. Migration: replace hard-coded v0.5 Glue exclusions with version-specific obligations, and attach delivery evidence to accepted revisioned requirements. Reversion: hold publication and fix or revert the candidate source, then qualify a new identity; never mutate an already published immutable release.

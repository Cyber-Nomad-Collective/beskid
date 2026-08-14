# Stable and unstable compiler release design

## Scope

This change is limited to GitHub Actions, release version computation, native
artifact packaging, release metadata and notes, CI contract tests, and release
documentation. It does not change compiler/runtime or LSP implementation,
application code, or website UI. Download-site and downstream version-consumer
updates are deferred until this pipeline is merged and GitHub Actions passes.

## Release channels

The compiler workflow has two channels:

- `stable` is the existing fully gated path. It may build and publish only when
  the compiler and LSP gate succeeds and all three supported platforms produce
  both CLI and LSP artifacts.
- `unstable` is the automatic non-stable path. On a main push, a failed compiler
  gate selects unstable. A manual dispatch may explicitly select either
  channel; explicit stable remains gate-dependent.

The central version resolver emits `0.4.<run-number>` for stable and exactly
`0.4.<run-number>-unstable` for unstable. No commit fragment appears in either
version. The compiler commit and superrepo commit are provenance metadata.

## Native platform results

Linux x86_64, macOS arm64, and Windows x86_64 execute as independent matrix
lanes. Each lane attempts both its CLI and LSP build and records both outcomes
in a machine-readable platform-result JSON document. Result documents identify
the platform target, expected asset names, available assets, missing assets,
and build outcomes.

For stable, any failed CLI or LSP build fails its lane and therefore prevents
publication. For unstable, build failures are retained in the result document
without preventing other lanes from completing or the publisher from running.
Unstable publication is allowed when at least one platform has both its CLI and
LSP binary. A platform with only one binary is reported as incomplete and its
partial binary is not advertised as an available platform pair.

## Aggregation and publication

A single aggregation step consumes the three platform results plus the gate
outcome. It emits `release-state.json`, the machine-readable stable/unstable
state used by this workflow and future downstream pipelines. The state records
schema version, release channel and version, compiler and superrepo commits,
test outcomes, complete platforms, available assets, missing assets, and failed
platform builds.

The publisher uses this state as its sole release-note input. Both immutable
and rolling releases contain the following sections:

1. Channel
2. Available artifacts
3. Missing artifacts
4. Successful tests
5. Failed tests
6. Commit provenance

The release state is uploaded as a workflow artifact and as a GitHub release
asset. Stable publication requires a successful gate and all supported platform
pairs. Unstable publication ignores failed tests but records them, and requires
at least one complete platform pair. Rolling tags remain `cli-stable`,
`lsp-stable`, `cli-unstable`, and `lsp-unstable`; immutable tags retain the
resolved version, including the `-unstable` prerelease suffix.

## Failure behavior

- Version resolution fails closed for unsupported channels, non-main refs, or
  invalid run numbers.
- Stable never publishes after a failed gate or incomplete platform matrix.
- Unstable never publishes when no platform produced both binaries.
- Missing platform JSON is treated as a failed platform and appears in state.
- Release notes do not infer success from absent data.
- Publishing token absence remains a hard error after eligibility is proven.

## Diagnostic report contract

Compiler, LSP, Corelib, Beskid-test, Rust-test, and native release commands run
through CI-owned reporting wrappers. A failed command retains its raw log and
emits JSON with component, stage, platform, command, emitted test/case name,
qualified identifier, source location, concise reason, and retained-log path.
GitHub also receives an error annotation and job-summary entry.

The qualified identifier uses an authoritative emitted test or signature when
one exists. For example, an emitted Rust test `parser::rejects_bad_input` in the
compiler gate may be represented as `compiler::parser::rejects_bad_input`.
Parameter/signature text is preserved when the originating output supplies it.
When output does not establish a member, type, or signature, the identifier is
the literal `unavailable`; reports never fabricate a source-to-symbol mapping.

Filesystem locations are normalized to repository-relative paths, including
GitHub-hosted Windows paths such as `G:\a\beskid\beskid\...`. Opaque compiler
AST keys such as `#g21:n46` are not filesystem locations or human-readable
symbols. They remain in the reason and raw evidence but are not rewritten into
invented module/member names.

## Verification

Shell contract tests cover exact version strings, stable and unstable gate
selection, platform-pair eligibility, partial and total platform failure,
release-state JSON, required release-note sections, and workflow wiring. The
existing stable resolver and publish tests remain in the suite. Local
verification also parses the workflow with the available YAML tooling and runs
the CI foundation test entrypoint.

## Deferred follow-up

After this CI/CD change is merged and its GitHub Actions run passes, audit the
website download resolver, VS Code bootstrap, distribution workflow, setup
action, and any other rolling-tag or version consumers against the published
`release-state.json`. No consumer or website change is part of this slice.

# Woodpecker cutover ledger

This ledger is the cutover record for moving repository automation from GitHub
Actions to the Woodpecker service on `bdziam.dev`. It is intentionally an
operational checklist: GitHub remains an artifact, package, and source host
where a publisher requires it, but GitHub Actions must not remain the executor.

The three existing Woodpecker target pipelines are build-only. They produce
durable target output and do not aggregate a release, publish artifacts, or
advance rolling aliases. Do not delete a GitHub workflow merely because its
native build has a Woodpecker counterpart.

## Authority and safe execution model

A release controller running on the VPS must own a single release transaction:

1. Resolve an explicit version, source commit, compiler commit, and channel.
2. Start and observe the labelled Linux, macOS, and Windows Woodpecker builds.
3. Collect each target's verified result through a durable, access-controlled
   artifact exchange.
4. Build `release-state.json` and stop unless it is publishable.
5. Publish immutable artifacts before rolling aliases, then run downstream
   packaging and editor publication only from the verified stable state.
6. Record completion only after every required downstream publisher succeeds.

The controller needs durable state and mutual exclusion per source commit. The
current three independent pipeline files cannot supply this fan-in or prevent a
partial platform publication on their own. A GitHub Release handoff may remain
the temporary artifact exchange while the controller, rather than GitHub
Actions, calls `github-release-handoff.sh`; an object store on the VPS is the
long-term alternative.

## Workflow responsibility map

| Current GitHub surface | Trigger and obligation | VPS-backed replacement | Required acceptance evidence |
| --- | --- | --- | --- |
| `.github/workflows/compiler-handoff-cleanup.yml` | Daily at 04:23 UTC and manual cleanup of `compiler-handoff-*` releases older than 31 days. | A protected VPS scheduled controller job that invokes `scripts/ci/github-release-handoff.sh cleanup Cyber-Nomad-Collective/beskid_compiler 31`. Retain it while GitHub Releases are used as the handoff store. | A dry, read-only listing identifies only expired draft/prerelease handoffs; a controlled test removes only a disposable handoff and its tag. |
| `.github/workflows/compiler-release.yml` | Manual, main-only, serialized three-target compiler build; initializes a durable handoff, aggregates `release-state.json`, and publishes immutable plus rolling CLI, LSP, and bundle releases. | The release controller dispatches the existing `platform=linux/amd64`, `platform=darwin/arm64`, and `platform=windows/amd64` Woodpecker workers, collects all three platform-result files, calls the existing state and stream scripts, and publishes only after a successful aggregate. | One non-public/dry transaction proves the exact source and compiler SHAs, all three target checksums, `publishable: true`, immutable-before-rolling ordering, and no alias movement on failure. |
| `.github/workflows/distribute.yml` | Runs after a compiler release or manually; produces Windows MSI/EXE, macOS DMG and Homebrew formula, Debian package, two container images, and the final `distrib-version.txt` marker. | Controller dispatches platform packaging jobs after the verified release state. It waits for Windows installer, macOS DMG/Homebrew, Linux `.deb`, and Linux container results before writing the marker last. | A controlled version confirms each installer is attached to its immutable and rolling release, container image digests exist under both tags, and the marker is absent if any required platform publisher fails. |
| `.github/workflows/publish-open-vsx.yml` | After a successful stable compiler release, builds and gates four VSIX targets (Linux x64, macOS arm64/x64, Windows x64) and publishes them to Open VSX. | A protected release-controller stage first verifies the stable `release-state.json`, then runs the target build/gate work and calls `scripts/ci/open-vsx-publish.sh` once per platform. | All four VSIX builds and extension/compiler gates pass; an actual macOS x64 cross-build on the arm64 worker is verified; a repeat publish is idempotent; unstable releases never reach Open VSX. |
| `.github/workflows/publish-zed-extension.yml` | On a `v*` tag, validates the Zed manifest, package, language assets, and stable LSP provenance, then uses a pinned GitHub Action to update Zed Extensions. | A Linux Woodpecker tag pipeline performs the same local validations and a checked-in replacement for the pinned action: update the authorized fork, create or update the Zed Extensions pull request, and leave merging to the Zed review process. | A disposable/tag test proves a version mismatch fails before mutation, checks all stable LSP assets and provenance, and opens the expected PR without direct writes to `zed-industries/extensions`. |
| GitHub CodeQL default setup (repository configuration, not a tracked workflow) | External GitHub configuration is distinct from Woodpecker. | No Woodpecker replacement: explicitly removed by the user on 2026-09-13. | CodeQL is not a Woodpecker release gate. No substitute scanner or scheduled scan is enabled. Existing GitHub settings require separate cutover reconciliation. |

## Secret and permission ledger

Store these as protected Woodpecker/controller secrets outside the repository.
Use separate least-privilege credentials; do not reuse the server OAuth or
agent secrets for publishing.

| Secret name | Consumer | Minimum capability | Status |
| --- | --- | --- | --- |
| `COMPILER_RELEASE_TOKEN` (or a replacement with the same narrow scope) | handoff cleanup and compiler release publisher | Read/write releases and tags only in `Cyber-Nomad-Collective/beskid_compiler`. | Pending migration. |
| `COMPILER_SUBMODULE_TOKEN` | compiler checkout and release-state readers | Read access to private compiler/submodule content and release assets. | Pending migration. |
| `DISTRIB_GH_PAT` | installer/distribution publisher | Read release assets and write installer assets/releases in `beskid_compiler`. | Pending migration. |
| `HOMEBREW_TAP_GIT_TOKEN` | Homebrew formula publisher | Write only `Cyber-Nomad-Collective/beskid_homebrew`; optional only if the formula publisher is deliberately skipped. | Pending migration. |
| `GHCR_PUBLISH_TOKEN` | container publisher | `packages:write` for the two existing GHCR image packages. GitHub Actions' ephemeral `GITHUB_TOKEN` is not available on the VPS. | Pending migration. |
| `OVSX_TOKEN` | Open VSX publisher | Publish namespace/extension versions only. | Pending migration. |
| `BESKID_VSCODE_SUBMODULE_TOKEN` | Open VSX checkout | Read only `beskid_vscode`. | Pending migration. |
| `COMMITTER_TOKEN` | Zed extension PR publisher | Fine-grained access to the approved fork and pull-request operations; never direct write access to `zed-industries/extensions`. | Pending migration. |

The existing Woodpecker server secrets (`WOODPECKER_GITHUB_CLIENT`,
`WOODPECKER_GITHUB_SECRET`, `WOODPECKER_AGENT_SECRET`, and
`WOODPECKER_GRPC_SECRET`) authenticate the service and workers. They are not
publication credentials and must never be made available to repository steps.

## Cutover checklist

- [x] VPS Woodpecker server and Linux Docker worker are healthy.
- [x] Native macOS worker is registered and running.
- [ ] Native Windows worker is configured, connected, and executes a harmless
      labelled build. AWS authentication must be restored before this step.
- [x] Build-only Linux, macOS, and Windows pipeline definitions exist.
- [ ] Release controller has durable transaction state, cross-worker artifact
      exchange, source-SHA locking, and failure-safe cleanup.
- [ ] Every publisher secret above is installed only in protected release/tag
      contexts and is verified without printing a value.
- [ ] Native target builds are exercised from one identical source revision;
      their structured results aggregate to a publishable release state.
- [ ] Distribution fan-out is exercised with a non-public/disposable version;
      final marker ordering and retry behavior are verified.
- [ ] Open VSX and Zed replacements pass their gates and idempotency/PR tests.
- [ ] Workflow-contract tests are replaced with provider-neutral checks; no
      test continues to assert deleted GitHub Actions YAML.
- [ ] A reviewed cutover confirms that the old workflows are disabled or
      removed only after the replacement acceptance evidence exists.

## Verified versus pending

Verified facts are limited to the live Woodpecker service, Linux Docker worker,
macOS worker, CLI authentication, and the checked-in build-only pipeline
contracts. No end-to-end VPS release, distribution, Open VSX, Zed, Windows
worker has yet been exercised. Consequently,
the repository is not ready to remove the remaining GitHub workflow files.

## Integration record (2026-09-13)

- VPS pipeline 2 passed the four build-migration contract suites after disabling
  recursive clone. This was not a native compiler build or release qualification.
- VPS pipeline 3 (`b683ec29`) passed Linux contract/evidence checks and the actual
  independent OpenSpec workflow; strict validation reported 214 passed, 0 failed.
- `standard.yml` runs the four canonical OpenSpec validators independently;
  all four commands passed locally on the migration branch without changing
  the catalog. Current-main results remain a separate source-specific claim.
- `woodpecker-release-evidence.mjs` checks a closed set of three target results,
  full source SHAs, stable version, artifact hashes and observed gate evidence.
  It rejects symlinked inputs and extra checksum claims. The format verifies
  integrity, not the identity of whoever supplied the evidence.
- `woodpecker-aggregate-release.mjs` makes an exclusive private snapshot,
  revalidates it, then uses the canonical release-state and manifest builders.
  It never publishes. Its output directory is not reused after interruption.
- `woodpecker-package-platform.mjs` consumes qualified evidence and the pinned
  distribution recipes, emitting checksum-linked package results only after
  success. A real macOS fixture DMG passed locally; this is not qualification of
  the compiler or Windows installers. It also renders Homebrew metadata using
  the complete bundle's checksum and actual immutable archive name.
- Immutable stream publication now accepts an existing release only when its
  expected assets are byte-identical; differing or incomplete releases require
  operator investigation and are not clobbered. Mocked GitHub-boundary tests
  cover equal retries, mismatch and wrong source/version arguments.
- CodeQL was removed from Woodpecker at the user's explicit request. Its
  workflow, scripts, tests, and release gate are absent; no cron was installed.
  Historical run logs remain diagnostic records, not active release requirements.
  Linux build containers retain their general 3 GiB/two-CPU resource limits.

Ruling: native build/standard workflow policy tests cover their named,
secret-free lanes. Editor and publisher definitions own separate
policy tests; an exact workflow-count rule would prevent adding replacements.
The cost is that every new lane must be reviewed for its own authority boundary.

### Product failure retained

At base `150efc62`, `scripts/ci/build-release-artifact.sh` produces the old flat
`beskid_cli`/`native-runtime-kit` archive. The pinned `beskid_distrib` revision
`3c1681fb77eb92be1abd47593517c409abf809a2` requires `bin/beskid`, the ABI-v5 `lib`
tree, corelib, packages and `release-version.txt`. This mismatch predates the
migration and prevents end-to-end packaging. The replacement must reject it,
not relax the distribution bundle contract.

### Manual selection

Use `woodpecker-cli pipeline create Cyber-Nomad-Collective/beskid --branch
<branch> --var BESKID_TASK=<task>` with `validate`, `build`,
`editors` or `platform` as appropriate. Native build and editor tasks also
require `--var BESKID_RELEASE_VERSION=<exact-stable-version>`. These variables
select work, not publication authority. Never put secret values in CLI arguments.

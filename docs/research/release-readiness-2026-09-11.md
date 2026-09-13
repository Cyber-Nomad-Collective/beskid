# beskid release readiness audit

**Date:** 2026-09-11
**Scope:** Current `main`, hosted release evidence, and feasibility of assembling a
macOS/Linux/Windows release manually.
**Method:** Read-only inspection of the checked-out repository, GitHub's first-party
API/releases, AppVeyor's first-party project API/log, and the referenced Codex task.
No build, tag, release, package, image, deployment, or cloud resource was created or
changed.

## Verdict

The entire release is **not green**, and the current tree must not be published as a
stable or rolling release by bypassing the gates.

The canonical source revision is
[`7390f9892bbe6711c6ac85adbcdd02dedfbd87cb`](https://github.com/Cyber-Nomad-Collective/beskid/commit/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb),
which pins compiler revision
[`59d9c37337ae54d1b84828eb98c7aaf7e6812935`](https://github.com/Cyber-Nomad-Collective/beskid_compiler/commit/59d9c37337ae54d1b84828eb98c7aaf7e6812935).
The AppVeyor build for that exact superrepo revision is still running, not green;
its first compiler job has stopped emitting progress and all later jobs are queued.
The most recent published compiler release is an older, explicitly unstable partial
release whose retained state records failed Linux validation and a missing Linux
bundle. Finally, the newly migrated release workflow has a version-number regression
that would turn AppVeyor build 91 into `0.4.91(-unstable)`, behind the already
published `0.4.743-unstable`.

## Codebase and hosted facts

| Fact | Primary evidence | Consequence |
|---|---|---|
| Local `main`, `origin/main`, and GitHub `main` all resolve to `7390f989...`; the working tree also contains three unrelated untracked worktree directories. | [GitHub commit](https://github.com/Cyber-Nomad-Collective/beskid/commit/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb); local `git status`, `git rev-parse HEAD` | The audited source SHA is unambiguous, but a release assembly should use a fresh checkout rather than the current dirty directory. |
| The superrepo pins compiler `59d9c373...` (“Preserve frame pointers for production codegen”), one commit after the `3a6d679...` compiler revision used by the latest CLI/LSP release. | Current [`compiler` gitlink](https://github.com/Cyber-Nomad-Collective/beskid/tree/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/compiler); [compiler fix](https://github.com/Cyber-Nomad-Collective/beskid_compiler/commit/59d9c37337ae54d1b84828eb98c7aaf7e6812935) | The current fix has not been published and cannot inherit evidence from `0.4.743-unstable`. |
| AppVeyor build `1.0.91` / build ID `54700058` targets `7390f989...` and reports `running`; `linux-compiler-runtime` started at 2026-09-10 21:31 UTC, while `linux-platform`, lint, macOS, Windows, VS Code, and Zed remain queued. | [AppVeyor build 1.0.91](https://ci.appveyor.com/project/pmikstacki/beskid/builds/54700058); [AppVeyor project API](https://ci.appveyor.com/api/projects/pmikstacki/beskid) | There is no completed three-host compiler proof, editor proof, platform gate, package publication, image manifest, or promotion for current `main`. |
| The active Linux job's public log ends at “Building native ABI-v5 runtime kit” at elapsed 00:01:19. | [AppVeyor job log](https://ci.appveyor.com/api/buildjobs/ikenl2ir4kr3gc7a/log) | The build is effectively blocked before the remaining serialized jobs can start; it is not evidence of success. |
| `appveyor.yml` deliberately sets `max_jobs: 1`; `linux-platform` depends on the `compiler-validation` group. | [`appveyor.yml` lines 7–45](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/appveyor.yml#L7-L45) | One stuck compiler job blocks all downstream proof and publication by design. |
| The AppVeyor commit status on current `main` is `pending`. GitHub also reports failed external “Push on main” and “Code Quality: Push on main” analysis runs for the same SHA. | [GitHub commit checks](https://github.com/Cyber-Nomad-Collective/beskid/commit/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/checks); [AppVeyor status target](https://ci.appveyor.com/project/pmikstacki/beskid/builds/54700058); [Push analysis](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/34532532608); [Code Quality analysis](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/34532532934) | “Entire release green” is false even before considering artifact publication. The external analysis failures are not a substitute for the repository's release gate, but they are still red hosted checks. |
| The root repository's newest conventional release is `v0.4.0`, published 2026-07-24. | [beskid v0.4.0](https://github.com/Cyber-Nomad-Collective/beskid/releases/tag/v0.4.0) | There is no newer whole-project GitHub release proving current `main`. |

## Latest published compiler evidence

The newest CLI and LSP streams are
[`cli-v0.4.743-unstable`](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.4.743-unstable)
and
[`lsp-v0.4.743-unstable`](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/lsp-v0.4.743-unstable),
both targeting compiler `3a6d679...`. They contain CLI/LSP binaries for Linux,
Apple arm64, and Windows x64. Their retained `release-state.json`, however, says:

- channel `unstable`, `gate_result: failure`;
- failed `compiler:rust-gate` and `compiler:abi-v5-runtime-kit-linux`;
- Linux CLI and LSP builds succeeded, but the Linux direct-install bundle aborted
  in Cranelift because frame pointers were not enabled;
- the macOS and Windows release builds and ABI-v5 runtime-kit jobs succeeded;
- `beskid-x86_64-unknown-linux-gnu.tar.gz` is missing.

The durable evidence is available from the
[`0.4.743` handoff release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/compiler-handoff-34456915875).
Its `release-state.json` is the primary machine-readable record. The state was
publishable only because the repository explicitly permits an unstable release when
at least one platform has a complete CLI/LSP pair; stable requires a successful gate
and all three complete platforms
([`build-release-state.sh` lines 149–177](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/scripts/ci/build-release-state.sh#L149-L177)).

There is no `stable`, `cli-stable`, or `lsp-stable` release in the compiler repository.
The rolling `unstable` bundle remains based on older compiler `01fadccd...`, while
the rolling CLI/LSP releases point at `3a6d679...`. Therefore the public rolling
streams do not describe one complete latest release.

## Manual three-host build feasibility

Building **candidate artifacts** on three native hosts is supported by the repository:

- [`build-release-artifact.sh` lines 1–35](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/scripts/ci/build-release-artifact.sh#L1-L35)
  explicitly requires native Linux for `x86_64-unknown-linux-gnu`, native macOS for
  `aarch64-apple-darwin`, and native Windows for `x86_64-pc-windows-msvc`;
- [`build-release-platform.sh`](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/scripts/ci/build-release-platform.sh)
  is the canonical wrapper that builds CLI, LSP, and bundle and records structured
  per-platform results;
- the current machine is Apple arm64 and therefore matches the macOS target;
- an x86-64 glibc Linux container can be a suitable native Linux build environment
  if it checks out the exact superrepo SHA plus gitlinks and installs the repository's
  pinned toolchain/build dependencies. Docker Desktop is installed locally, but its
  engine was not running during this audit;
- an x86-64 Windows Server host with the MSVC and pinned LLVM tools can run the
  Windows build. A Windows container cannot run directly on the Darwin kernel; the
  Windows host/VM is the relevant boundary.

The referenced Codex task does **not** supply that Windows host. It reached a final
AWS launch configuration for a Windows Server 2025 EC2 instance, then stopped for
approval to expose SSH from one public IP and incur cost. The subsequent task state
showed a failed launch/account-access flow, and its last response handed back an AWS
sign-in page. No successful instance ID, SSM/SSH connection, source checkout, build,
or artifact was recorded. A read-only AWS check from this session could not refresh
that fact because the `beskid-windows` AWS login has expired. The task therefore must
be treated as **no Windows builder available until re-proved**, not as completed
Windows infrastructure.

## Why manual publication is unsafe today

1. **Current exact-SHA evidence is incomplete.** AppVeyor build 91 has not completed
   any macOS or Windows job, and has not reached the platform, editor, package, or
   image lanes.
2. **The release version contract regressed during the AppVeyor migration.** The
   manual workflow describes `compiler_run_number` as the “AppVeyor build number”
   ([`compiler-release.yml` lines 4–30](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/.github/workflows/compiler-release.yml#L4-L30))
   and passes it into `GITHUB_RUN_NUMBER`
   ([lines 69–94](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/.github/workflows/compiler-release.yml#L69-L94)).
   The resolver still defines the version as exactly `0.4.<GITHUB_RUN_NUMBER>`
   ([`resolve-beskid-version.sh` lines 1–38](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/scripts/ci/resolve-beskid-version.sh#L1-L38)).
   Dispatching from build 91 would mint `0.4.91` or `0.4.91-unstable`, a numerical
   rollback from `0.4.743-unstable`.
3. **AppVeyor success is currently self-attested input.** The workflow accepts an
   operator-selected `appveyor_gate_result`, then merely writes that value, build
   label, and source SHA to a text file
   ([`compiler-release.yml` lines 226–237](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/.github/workflows/compiler-release.yml#L226-L237)).
   It does not query AppVeyor to prove the build ID, terminal status, result, source
   SHA, or required jobs. Selecting `success` manually could falsely authorize stable
   publication.
4. **Publication advances immutable and rolling streams.** The publisher creates or
   edits GitHub releases and clobbers rolling assets/tags
   ([`publish-release-stream.sh` lines 105–129](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/scripts/ci/publish-release-stream.sh#L105-L129)).
   This is externally visible and cannot be treated as a harmless local workaround.
5. **The whole release includes more than native compiler binaries.** The serialized
   AppVeyor graph also covers editor validation and the Linux platform lane; that lane
   runs OpenSpec, conformance, security, Corelib, shared UI/Nexus, Tracker, integration,
   package publication, five service images, digest evidence, and promotion
   ([`appveyor-entrypoint.sh` lines 8–59](https://github.com/Cyber-Nomad-Collective/beskid/blob/7390f9892bbe6711c6ac85adbcdd02dedfbd87cb/scripts/ci/appveyor-entrypoint.sh#L8-L59)).
   Three hand-built CLI/LSP bundles would not make the *entire* release green.

## Release blockers and safe next proof

Blockers, in order:

1. Diagnose or terminate the stuck AppVeyor Linux runtime job and obtain a new
   completed build for exact source `7390f989...` with every required job successful.
2. Fix the release-version authority so an AppVeyor-derived version is monotonic
   relative to published `0.4.743-unstable`; add a fail-closed remote monotonicity
   check before creating or editing any tag.
3. Make AppVeyor evidence machine-verified in the release workflow: query the cited
   build and require the exact source SHA, terminal `success`, and complete required
   job set rather than accepting a typed result.
4. Prove or provision the Windows builder. The referenced AWS work is incomplete.
5. If hosted CI remains unavailable, use the three hosts only to generate and retain
   **candidate** `build-release-platform.sh` outputs for the exact same source and
   gitlinks. Do not call `publish-release-stream.sh`, advance rolling tags, push
   packages/images, or label the candidate stable until the aggregation and gate
   policy defects above are repaired.

The recommended answer to “can we just ignore CI/CD and release manually?” is:
**we can manually reproduce native candidate builds, but we cannot safely or
truthfully publish the whole current release yet.**

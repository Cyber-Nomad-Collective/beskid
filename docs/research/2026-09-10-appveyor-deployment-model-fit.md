# AppVeyor fit for the beskid deployment model

**Date:** 2026-09-10
**Scope:** Fit beskid's AppVeyor validation and image-publication pipeline to a
private-registry/Watchtower production model.
**Source policy:** Product claims below use AppVeyor's official documentation,
API documentation, build-image catalogue, or AppVeyor-hosted project status.

## Conclusion

AppVeyor fits beskid well as the **validation and publication authority**, but
it should not be configured as a production deployment environment. The
repository implementation now expresses the intended authority boundary: the
project-level `max_jobs: 1` cap serializes builds through AppVeyor's FIFO queue;
the three compiler jobs remain separate required members of
`compiler-validation`; `linux-platform` fans in after their success; `deploy`
stays off; immutable images are published before packages and mutable tags;
and Watchtower alone changes production containers.
The shared event predicate denies rebuilds and incomplete-job reruns as well as
pull requests, tags, forced/manual/API builds, schedules, and non-`main`
events. ([Job workflows](https://www.appveyor.com/docs/job-workflows/),
[Environment variables](https://www.appveyor.com/docs/environment-variables/))

This is repository evidence, not a live account proof. Hosted timeout,
worker-image availability, private nested-submodule authentication, registry
reachability, and the actual AppVeyor status context remain activation checks.

## Codebase facts

| Fact | Repository evidence | Consequence |
|---|---|---|
| Root AppVeyor configuration owns four native lanes | `appveyor.yml` | One AppVeyor project can publish a single aggregate status. |
| Project concurrency is capped at one job | `max_jobs: 1` in `appveyor.yml` | AppVeyor's FIFO project queue sequences builds so an older build cannot promote after a newer build. |
| `linux-platform` depends on the compiler-validation job group | `appveyor.yml` | No platform publication starts before all three required compiler jobs succeed. |
| The platform lane orders rehearsal, immutable images, live packages, final manifest, then promotion | `scripts/ci/appveyor-entrypoint.sh` | Package failure prevents evidence finalization and `production` movement; promotion failure leaves finalized evidence for artifact upload. |
| One library defines the registry, namespace, five lanes, and tag refs | `scripts/ci/lib/appveyor-platform-images.sh` | Publisher, promoter, and manifest cannot drift to different image identities. |
| Immutable publication records each registry digest; promotion pulls and retags without rebuilding | `scripts/ci/appveyor-platform-publish.sh`, `scripts/ci/appveyor-platform-promote.sh`, `scripts/ci/appveyor-image-manifest.sh` | Exactly five digest-backed records bind the AppVeyor artifact to one source SHA. |
| Publication is limited by a shared event predicate | `scripts/ci/lib/appveyor-event-policy.sh` | Fresh trusted `main` pushes only; rebuilds and incomplete reruns are denied. |
| AppVeyor's deployment phase is disabled | `deploy: false` in `appveyor.yml` | Correct for Watchtower-only production ownership. |
| Private submodules are initialized from build scripts | `scripts/ci/appveyor-install.sh`, `.gitmodules` | Authentication must work after AppVeyor's root clone on every OS. |
| Linux platform artifacts include `.appveyor-reports/**` | `appveyor.yml`, `scripts/ci/appveyor-image-manifest.sh` | The build retains five digest-backed image records; the registry remains the durable artifact store. |
| The public AppVeyor badge currently reports `failing` | [AppVeyor-hosted badge](https://ci.appveyor.com/api/projects/status/github/Cyber-Nomad-Collective/beskid?svg=true) | A project is connected, but a green proof build and authenticated settings audit are still required. |

## Implemented AppVeyor job topology

The repository uses one project and one repository-owned `appveyor.yml`:

```text
linux-compiler  ─┐
macos-compiler  ─┼─ compiler-validation group ──> linux-platform
windows-compiler ┘                                  gates
                                                     package rehearsal
                                                     build all five images
                                                     publish immutable tags
                                                     publish packages
                                                     finalize digest evidence
                                                     advance production tags
```

In the environment matrix, give each row a `job_name`. Give the three compiler
rows `job_group: compiler-validation`, and set
`job_depends_on: compiler-validation` on `linux-platform`. Keep
`matrix.fast_finish: false` if the desired diagnostic policy is to finish and
report every native failure; no job should appear under `allow_failures`.
Set project-level `max_jobs: 1`: the three compiler members still form the
fan-in but execute one at a time, and later builds remain in AppVeyor's FIFO
project queue until the active build finishes. AppVeyor supports fan-in
dependencies directly in the environment matrix.
([Job workflows](https://www.appveyor.com/docs/job-workflows/))

This topology deliberately keeps the platform job intact. AppVeyor caches are
isolated per matrix job, so splitting “build images” and “publish images” into
different hosted VM jobs would require an explicit artifact/registry handoff,
not a cache. ([Build cache](https://www.appveyor.com/docs/build-cache/))

Within `linux-platform`, the implemented mutation order is:

1. complete every platform gate and package dry run;
2. build all five images locally;
3. authenticate to `cr.beskid-lang.org`;
4. push all five immutable `sha-<full-commit>` tags;
5. publish the corelib/templates package;
6. finalize a manifest containing AppVeyor build/job IDs, source SHA,
   image names, immutable tags, and registry digests;
7. move all five `production` tags to the already-pushed immutable images;
8. upload the already-finalized manifest as an AppVeyor artifact even when
   promotion or promoter cleanup fails; and
9. use fresh restrictive temporary Docker configurations for publisher and
   promoter authentication, then log out and remove each configuration in a
   trap/finalizer; cleanup failure fails success but never replaces an earlier
   failure.

The live package result deliberately precedes mutable-tag promotion. A missing
or rejected `BESKID_PCKG_API_KEY` therefore stops the shell before Watchtower
can observe a new `production` tag and before the manifest claims package
success. Finalizing the five immutable digest records before promotion preserves
the intended-source evidence if promotion or promoter cleanup fails; the job
still reports that failure.

There is no atomic transaction spanning five independent image repositories.
Watchtower can observe a partially advanced tag set if the worker stops during
step 6. AppVeyor cannot remove this registry/Watchtower limitation. The practical
contract is **eventual convergence with one immutable source SHA**, proved by
the digest manifest and operator observation; CI must not gain Watchtower
control merely to hide this limitation. Rebuild and incomplete-rerun events are
denied mutation authority rather than being used as a convergence mechanism.

## Exact project and account settings

Set or verify the following in the AppVeyor project UI. Several controls are
UI-only even when repository YAML is active. Repository YAML overrides ordinary
UI build configuration, but UI environment variables and notifications merge
with YAML, and the listed General-tab security/event settings remain active.
([Build configuration](https://www.appveyor.com/docs/build-configuration/#appveyoryml-and-ui-coexistence))

| Setting | Recommended value |
|---|---|
| Repository | The canonical GitHub `Cyber-Nomad-Collective/beskid` repository; one AppVeyor project only |
| Default branch | `main` |
| Ignore `appveyor.yml` | Off |
| Custom YAML path | Empty/default, so root `appveyor.yml` is authoritative |
| Push events | Enabled |
| Pull-request events | Enabled |
| Tag builds | Disabled by `skip_tags: true` in YAML |
| Schedule | None |
| Rolling builds | Disabled initially; cancellation during mutable-tag promotion could leave a mixed production set |
| Secure variables in same-repository PRs | Disabled |
| Deployments in PRs | Disabled |
| Save build cache in PRs | Disabled |
| Always build closed PRs | Disabled |
| Hosted job timeout | 60 minutes; AppVeyor does not allow a hosted increase |
| Build priority | Normal unless the account has a documented shared-queue policy |
| Custom commit status context | `ci/appveyor/beskid`; require this exact observed context only after a green proof build |
| `max_jobs` | `1` in YAML, using the FIFO project queue as the release sequencer |

AppVeyor documents a 60-minute quota per hosted build **job**, account-level
concurrency, a FIFO project queue, and `max_jobs` as a per-project cap. Choosing
one trades longer end-to-end builds for the no-rollback ordering guarantee. The
present `linux-platform` job serializes many gates and five image builds, so it
must be timed in a live build. Every hosted job retains its own 60-minute limit;
if one exceeds it, use a private/BYOC worker or reduce/repartition the work
without breaking the fan-in and cross-build publication barriers. Hosted
timeout cannot be increased; private-cloud timeout can. ([Build pipeline and queue](https://www.appveyor.com/docs/build-configuration/#build-queue),
[BYOC](https://www.appveyor.com/docs/byoc/))

Before relying on `ci/appveyor/beskid` in GitHub rules, verify the precise
context AppVeyor emits for a commit. The custom context is UI-only. Keep the
existing merge rule until the context is green on both a branch push and a pull
request. The aggregate AppVeyor build, not an individual image lane, should be
the required check.

## Worker images and native proof

The checked-in image identifiers are documented:

- `Ubuntu2204` was introduced as AppVeyor's Ubuntu 22.04 image, and AppVeyor's
  current image updates still refer to `Previous Ubuntu2204`. The current Linux
  catalogue lists Docker on the Ubuntu 22.04 worker. ([Ubuntu 22.04 announcement](https://www.appveyor.com/updates/page/4/),
  [Linux software](https://www.appveyor.com/docs/linux-images-software/))
- `macos-sonoma` is a documented macOS 14.2.1 worker image. The documentation
  does not establish the CPU architecture presented to this account, so
  `uname -m` and a native artifact inspection remain required proof.
  ([macOS software](https://www.appveyor.com/docs/macos-images-software/),
  [Sonoma image announcement](https://www.appveyor.com/updates/2024/02/15/))
- `Visual Studio 2022` is a supported Windows image and the current catalogue
  lists Visual Studio 2022 and its installed toolchain. ([Windows software](https://www.appveyor.com/docs/windows-images-software/))

Using `APPVEYOR_BUILD_WORKER_IMAGE` as a matrix variable is supported and can
select a different image for each job. ([Build environment](https://www.appveyor.com/docs/build-environment/#using-multiple-images-for-the-same-build))

The live jobs must still prove Docker Buildx, BuildKit SBOM/provenance flags,
architecture, Rust targets, MSVC environment variables, Homebrew LLVM, disk
capacity, DNS/TLS access to both beskid registries, and the total lane duration.
The installed-software catalogue is not a promise that every command-line
combination used by beskid succeeds.

## Registry and production boundary

Keep `deploy: off`. AppVeyor's deployment model is an artifact-consuming phase
or a named environment promotion. beskid instead publishes versioned container
artifacts, after which Watchtower independently reconciles production.
([Deployment overview](https://www.appveyor.com/docs/deployment/))

The scripted `docker login cr.beskid-lang.org --password-stdin` and pushes are
appropriate. One sourced library owns the exact registry, namespace, five
lanes, immutable refs, and production refs. Each publisher creates a fresh
mode-`0700` temporary `DOCKER_CONFIG` under a `077` umask, logs out, and removes
the configuration deterministically. Logout or removal failure fails an
otherwise successful script, while an earlier push/pull failure remains the
reported status. AppVeyor does not need a named deployment environment,
Deployment Agent, Compose access, server SSH key, Watchtower token, or
production host credentials. The registry account should be scoped to push
only `cr.beskid-lang.org/beskid/{site,learn,tracker,nexus,pckg}`; Watchtower
receives separate read-only credentials outside AppVeyor.

If the registry firewall restricts ingress, allow the official AppVeyor hosted
worker egress ranges or route only the Linux platform lane to a BYOC worker with
private network access. AppVeyor publishes its hosted worker IP ranges and
supports private build clouds for private-network requirements.
([Build-environment IP addresses](https://www.appveyor.com/docs/build-environment/#ip-addresses),
[BYOC](https://www.appveyor.com/docs/byoc/))

## Secrets, forks, and private submodules

Create these as **secure project environment variables**, not account-global
variables and not plaintext YAML:

| Variable | Availability | Purpose |
|---|---|---|
| `REGISTRY_USERNAME` | Trusted non-PR jobs only | Narrow beskid registry publisher identity |
| `REGISTRY_PASSWORD` | Trusted non-PR jobs only | Registry publisher credential |
| `BESKID_PCKG_API_KEY` | Trusted non-PR jobs only | Corelib/templates publication |
| `BESKID_SUBMODULE_SSH_KEY` (only if required) | Trusted non-PR jobs only | Read-only machine identity covering every private submodule |

AppVeyor encrypted values become ordinary environment variables inside an
eligible worker and can be printed by build code. By default they are not
decoded for pull-request builds; the UI can enable them only for PRs from the
same repository. Keep that override disabled. ([Secure variables](https://www.appveyor.com/docs/build-configuration/#secure-variables))

AppVeyor creates a deploy key for the private **root** repository, but the
official private-submodule guide says that key does not automatically authorize
submodule repositories. Multiple private submodules require a dedicated SSH
machine-user key (or equivalent token) authorized across them and installed
before `git submodule update --init --recursive`.
([Private Git submodules](https://www.appveyor.com/docs/how-to/private-git-sub-modules/),
[repository onboarding](https://www.appveyor.com/docs/))

This creates a real policy conflict for untrusted PRs: withholding the shared
credential is secure, but private submodules then cannot be checked out. Do not
enable the credential for PR code. Choose one explicit model:

1. make build-required submodules public; or
2. run a public/no-secret PR gate and run the complete private-submodule gate on
   trusted branch pushes; or
3. use a separately designed read gateway that exposes only immutable approved
   source archives and no reusable Git credential.

The current pipeline assumes full submodule initialization in PR jobs, so this
must be proved or redesigned before making AppVeyor the required PR check.

Also extend the shared mutation predicate to reject
`APPVEYOR_RE_BUILD=True` and `APPVEYOR_RE_RUN_INCOMPLETE=True`. AppVeyor documents
these independently from forced and scheduled builds. A rebuild of a historical
green `main` commit must not be able to move `production` backward.
([Environment variables](https://www.appveyor.com/docs/environment-variables/))

## Artifacts, cache, test results, and notifications

Start without build caches. Every AppVeyor job has an isolated cache, PR cache
writes are disabled by default, account quotas are hard limits, and caches
cannot transfer output between matrix jobs. After timing proof builds, cache
only dependency downloads with lockfiles/toolchain manifests as invalidation
dependencies; do not cache release artifacts, Docker credentials, package
tokens, or `production` state. ([Build cache](https://www.appveyor.com/docs/build-cache/))

Declare `.appveyor-reports/**` as an artifact and add the image/package manifest
described above. AppVeyor artifacts are useful build evidence but are not
permanent archives: the documented retention is one month for free accounts
and three months for paid accounts. Immutable registry tags and the package
registry remain the durable artifact stores. ([Packaging artifacts](https://www.appveyor.com/docs/packaging-artifacts/#artifacts-retention-policy))

Where existing test runners can emit JUnit, xUnit, NUnit, or MSTest XML, upload
results to AppVeyor's test-results endpoint using `APPVEYOR_JOB_ID`; this makes
failures navigable without changing the gate command. ([Running tests](https://www.appveyor.com/docs/running-tests/#uploading-xml-test-results))

Configure one project notification for failure and status change, preferably an
existing operations email or secured webhook. Do not enable GitHub PR comment
notifications: the commit status is sufficient and avoids noisy duplicate
GitHub automation. UI notifications merge with YAML, so audit both places to
prevent duplicates. ([Build notifications](https://www.appveyor.com/docs/notifications/))

## API and CLI boundary

Use the official REST API, authenticated with an environment-provided bearer
token, for auditable account inspection and controlled automation. It can list
projects, read project/YAML settings, start a build at an exact branch commit,
rerun/cancel builds, download job logs, update project environment variables,
and clear the project cache. ([REST API authentication](https://www.appveyor.com/docs/api/),
[projects and builds API](https://www.appveyor.com/docs/api/projects-builds/))

Do not place the account API token in this repository or in AppVeyor build
variables unless a job genuinely needs account-control authority—it does not in
this model. The official `appveyor` command on a worker is a Build Worker API
helper for messages, tests, artifacts, and build updates; it is not the account
administration interface. ([Build Worker API](https://www.appveyor.com/docs/build-worker-api/))

The locally installed community `appveyor-cli` is outside AppVeyor's official
documentation and support boundary. Prefer direct, narrowly scoped REST calls
from an operator shell with an ephemeral token for account inspection.

## Live-proof checklist

The documentation cannot establish these account/repository facts. Do not
enable publication or branch protection until they are observed:

1. Authenticated project settings show the canonical repository, `main`, root
   YAML enabled, no schedule, no rolling cancellation, and every PR security
   override disabled.
2. The account exposes all three named worker images, and a live queue proof
   confirms `max_jobs: 1` admits jobs/builds in release-safe FIFO order; the
   intentionally longer end-to-end duration is accepted.
3. A fork PR proves that registry/package/submodule credentials are absent and
   no mutation command is reached.
4. A same-repository PR proves the same secret isolation policy.
5. Private-submodule checkout follows the chosen no-secret PR model on Linux,
   macOS, and Windows without an interactive credential prompt.
6. Native jobs record `uname`/architecture, compiler/linker versions, and a
   correctly targeted runtime-kit binary.
7. Linux proves Docker daemon access, Buildx support for the configured SBOM and
   provenance options, sufficient disk, public TLS trust, firewall reachability,
   and registry push permissions.
8. A non-production branch build proves the exact GitHub status context and
   aggregate fan-in behavior.
9. A trusted `main` proof shows compiler group success before the platform job,
   all immutable tags before package publication, package success before
   complete digest-manifest finalization, that manifest before `production`
   promotion, artifact retention after a simulated promotion failure, and
   registry logout.
10. Rebuild, incomplete rerun, manual/API, scheduled, tag, non-main, and PR
    builds all prove zero mutation.
11. Watchtower converges all five services to the same source SHA without CI
    receiving any production-control credential.
12. Every job in the serialized build, especially the full Linux platform lane,
    finishes within the hosted 60-minute per-job cap; otherwise route it to a
    suitably sized BYOC worker.

After those proofs, make the observed `ci/appveyor/beskid` context required and
retain GitHub Actions only for GitHub Releases, distribution channels, editor
marketplaces, security, and repository maintenance. Do not configure AppVeyor
GitHub Release deployment providers: they would duplicate the intentionally
retained GitHub-native workflows.

## Official sources

- [Welcome and repository onboarding](https://www.appveyor.com/docs/)
- [Build configuration, matrix, UI coexistence, queue, and timeout](https://www.appveyor.com/docs/build-configuration/)
- [`appveyor.yml` reference and validator](https://www.appveyor.com/docs/appveyor-yml/)
- [Job workflows and fan-in](https://www.appveyor.com/docs/job-workflows/)
- [Build environment, worker images, networking, and image matrices](https://www.appveyor.com/docs/build-environment/)
- [Linux build workers and Docker](https://www.appveyor.com/docs/getting-started-with-appveyor-for-linux/)
- [Linux, macOS, and Windows installed software](https://www.appveyor.com/docs/linux-images-software/)
- [Private Git submodules](https://www.appveyor.com/docs/how-to/private-git-sub-modules/)
- [Environment variables and event identity](https://www.appveyor.com/docs/environment-variables/)
- [Build cache](https://www.appveyor.com/docs/build-cache/)
- [Artifacts and retention](https://www.appveyor.com/docs/packaging-artifacts/)
- [Build notifications](https://www.appveyor.com/docs/notifications/)
- [Deployment model](https://www.appveyor.com/docs/deployment/)
- [BYOC](https://www.appveyor.com/docs/byoc/)
- [REST API](https://www.appveyor.com/docs/api/)
- [Projects and builds API](https://www.appveyor.com/docs/api/projects-builds/)
- [Build Worker API](https://www.appveyor.com/docs/build-worker-api/)

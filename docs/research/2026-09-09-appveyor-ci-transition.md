# Research: AppVeyor CI transition

**Date:** 2026-09-09
**Scope:** Determine the constraints for moving Beskid CI from GitHub Actions to AppVeyor.
**Status:** Research baseline. The approved implementation is defined in
`docs/superpowers/specs/2026-09-09-appveyor-watchtower-migration-design.md`.

## Current repository evidence

- The GitHub repository currently has an active AppVeyor webhook, so event delivery has already been connected at least once. The webhook alone does not establish which AppVeyor account, project, authorization model, worker cloud, or status-check context owns the integration; those are account-side facts that must be inspected before migration.
- The checkout contains neither `appveyor.yml` nor `.appveyor.yml`. AppVeyor therefore has no versioned repository configuration in the current tree. Any existing project behavior is UI configuration or an externally hosted/custom-named YAML file until proved otherwise.
- GitHub Actions remains the implemented CI and delivery system. AppVeyor should initially be introduced as a non-required, non-deploying parity lane rather than replacing existing checks in one step.

## Official capability findings

### Configuration and repository integration

AppVeyor normally reads `appveyor.yml` from the repository root and also recognizes `.appveyor.yml`; a project can select another filename or an anonymously readable external YAML URL. Repository YAML and UI configuration are mutually exclusive rather than merged, except for environment variables, notifications, and a UI build-version fallback. Important controls remain UI-only, including the schedule, custom commit-status context, rolling builds, pull-request secret/cache/deployment policies, and disabling push or pull-request events. These rules make an account-settings export part of the migration record, not incidental setup. ([AppVeyor build configuration](https://www.appveyor.com/docs/build-configuration/), [YAML reference](https://www.appveyor.com/docs/appveyor-yml/))

AppVeyor's official onboarding documentation describes GitHub sign-in/authorization, repository enumeration, creation of repository webhooks, and deploy keys for private repositories. It does not establish from the repository alone whether the existing Beskid connection is OAuth-based or a GitHub App installation. GitHub Apps are installed for an account with explicit repository selection and requested permissions; organization policy can restrict installation to owners. The exact AppVeyor installation/authorization and selected repositories must therefore be verified in both services. ([AppVeyor onboarding](https://www.appveyor.com/docs/), [GitHub Apps overview](https://docs.github.com/en/apps/using-github-apps/about-using-github-apps), [GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app))

### Linux, macOS, and Windows workers

An AppVeyor build job runs on a fresh VM whose state is discarded afterward. The worker `image` is a matrix dimension, and one build can expand across Windows, Ubuntu, and macOS images. AppVeyor also supports private/BYOC workers when hosted images do not meet hardware, software, network, or architecture needs. ([Build environment](https://www.appveyor.com/docs/build-environment/), [BYOC](https://www.appveyor.com/docs/byoc/))

The public build-environment page lists Windows Visual Studio images, Ubuntu images, and macOS images, but some named versions on that page are old. It is not sufficient evidence that current hosted workers provide Beskid's required Linux x86-64, Windows x86-64, and macOS arm64 environments or the exact Rust, LLVM, Node, pnpm, and signing toolchains. Those facts require current account image enumeration and native proof jobs. ([Build environment](https://www.appveyor.com/docs/build-environment/), [macOS installed software](https://www.appveyor.com/docs/macos-images-software/), [Linux installed software](https://www.appveyor.com/docs/linux-images-software/), [Windows installed software](https://www.appveyor.com/docs/windows-images-software/))

### Docker, Buildx, and registries

AppVeyor documents Docker as preinstalled on Ubuntu workers and enabled with the `docker` service. The reviewed official documentation does not promise a particular Docker Buildx version, a multi-architecture builder, QEMU/binfmt registration, or an authenticated connection to GHCR. A parity job must install or verify Buildx explicitly, create the required builder, and prove each target/platform combination rather than infer it from Docker Engine availability. ([AppVeyor Linux builds](https://www.appveyor.com/docs/getting-started-with-appveyor-for-linux/))

GHCR accepts command-line authentication with a personal access token (classic), while GitHub Actions can use its job-scoped `GITHUB_TOKEN` for packages associated with the workflow repository. An AppVeyor worker is not a GitHub Actions job and does not inherit that token or Actions OIDC configuration. Registry credentials, package permissions, and least-privilege push scope must be configured separately in AppVeyor and tested without exposing them to pull-request builds. ([GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [GitHub Actions OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect))

### Matrices, conditions, artifacts, and caches

AppVeyor matrices can combine worker image, environment variables, platform, configuration, test category, and build cloud. Matrix entries can be excluded, allowed to fail, specialized, or conditionally skipped with `for.matrix`. A build succeeds only when all non-allowed jobs succeed. This can express the three-host compiler/runtime-kit proof, but GitHub Actions `strategy`, reusable workflows, expressions, job dependencies, and marketplace actions must be translated into AppVeyor phases and scripts rather than copied. ([Build matrix](https://www.appveyor.com/docs/build-configuration/#build-matrix))

Declared artifact paths are uploaded after build/test and become inputs to AppVeyor deployments. Cached paths restore after checkout and save near finalization. Each matrix job has a separate cache that cannot be shared with another job or project; pull-request cache writes are disabled by default and are enabled only in project UI. Cache storage and entry sizes are plan-limited. Beskid must not rely on a cache to transfer outputs between jobs or to provide release evidence. ([Packaging artifacts](https://www.appveyor.com/docs/packaging-artifacts/), [Build cache](https://www.appveyor.com/docs/build-cache/))

### Secrets

AppVeyor encrypts YAML values with an account-specific key. A `secure` value is decrypted into an ordinary environment variable during an eligible build and can still be printed by build code. Secure variables are withheld from pull-request builds by default; enabling them for same-repository pull requests is UI-only. Beskid should retain the default fail-closed PR policy and regard encryption as protection at rest/in YAML, not runtime isolation. ([Secure variables](https://www.appveyor.com/docs/build-configuration/#secure-variables), [Secure files](https://www.appveyor.com/docs/how-to/secure-files/))

### Events, checks, and deployment separation

Repository webhooks start builds on pushes, and the project UI provides a manual **New build** action. YAML supports branch filters, tag-only or non-tag-only builds, commit metadata filters, GitHub-only changed-file filters, and avoiding duplicate branch builds when an open pull request exists. Schedules are stored in UI and evaluated in UTC. Pull-request deployments and their surrounding scripts are disabled by default. ([AppVeyor onboarding](https://www.appveyor.com/docs/), [Build configuration](https://www.appveyor.com/docs/build-configuration/), [YAML reference](https://www.appveyor.com/docs/appveyor-yml/), [Deployment](https://www.appveyor.com/docs/deployment/))

GitHub required checks may be checks or commit statuses, and a rule can require an expected GitHub App as the source. The required context must be present on the latest commit; skipped or renamed integrations can leave a required context missing or pending. Because AppVeyor's custom status context is UI-only, the transition must inventory current required checks, observe AppVeyor's emitted context on a real commit, and change branch protection only during a controlled dual-run cutover. ([GitHub status checks](https://docs.github.com/en/pull-requests/reference/status-checks), [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [Troubleshooting required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks))

AppVeyor supports both inline deployment as the final synchronous CI phase and separate environment deployment, which asynchronously promotes artifacts from a successful build and can be started manually or by API. Beskid should use AppVeyor only for CI during parity work and keep existing release/deployment authority separate until artifact identity, approvals, credentials, and rollback behavior have been proved. ([AppVeyor deployment](https://www.appveyor.com/docs/deployment/), [GitHub Releases provider](https://www.appveyor.com/docs/deployment/github/))

### Monorepo, submodules, and capacity

GitHub repositories can use `only_commits.files` and `skip_commits.files` to limit builds by changed paths, which is useful for a monorepo. The YAML reference exposes clone folder, shallow clone, and clone-depth controls, but the reviewed official pages do not establish recursive submodule initialization equivalent to Beskid's setup contract. The AppVeyor configuration must call the repository's canonical setup/submodule scripts explicitly and validate pinned submodule SHAs. ([YAML reference](https://www.appveyor.com/docs/appveyor-yml/))

AppVeyor documents a 60-minute quota per build job. The number of jobs that can run simultaneously is account-plan controlled, and its documentation gives plan examples rather than a guarantee for this organization. A large image/environment matrix may queue even when logically parallel, so the current Beskid gate graph must be sized against the actual subscription or private-cloud capacity. ([Build pipeline and limits](https://www.appveyor.com/docs/build-configuration/#build-pipeline), [Build queue](https://www.appveyor.com/docs/build-configuration/#build-queue), [AppVeyor pricing](https://www.appveyor.com/pricing/))

## Gaps requiring proof builds or account verification

1. Identify the AppVeyor account/project behind the active webhook, its authorization type, repository scope, project owner, YAML source, worker cloud, schedule, and status context.
2. Prove current hosted or BYOC availability for native Linux x86-64, Windows x86-64, and macOS arm64 jobs, including every required compiler and packaging tool.
3. Prove root checkout plus recursive pinned submodules using Beskid's canonical setup path; do not introduce a second dependency bootstrap.
4. Prove pnpm package installation, Rust workspace builds, native runtime-kit tests, artifact retention, and same-revision aggregation on all three operating systems.
5. Prove Docker Buildx version/bootstrap, multi-architecture behavior, registry login, GHCR package write permission, and logout/credential cleanup. Do not enable image pushes in pull requests.
6. Record the exact AppVeyor commit-status/check name and producer identity, then test it against a non-required branch before changing GitHub rulesets.
7. Verify plan concurrency, queueing, job time limits, cache quotas, artifact retention, and macOS availability against the actual account rather than public examples.
8. Inventory GitHub Actions-only semantics: reusable workflows/actions, `needs`, matrices, permissions, environments/approvals, OIDC, concurrency groups, artifacts, caches, and repository/environment secrets. Assign an explicit AppVeyor equivalent or retain the GitHub implementation.

## Recommended migration constraints

- Add one root-owned AppVeyor configuration and keep reusable behavior in existing repository scripts. Do not fork build logic into AppVeyor-only copies.
- Begin with non-required CI parity and `deploy: off`. Keep GitHub Actions as the required and deployment authority until AppVeyor produces repeatable same-SHA evidence.
- Use explicit matrix jobs for native operating systems and fail closed when a required image, architecture, tool, submodule, secret, or artifact is absent.
- Preserve PR isolation: no secure variables, cache writes, deployments, signing, or registry pushes for untrusted pull-request code.
- Treat artifacts as immutable evidence and deployment inputs; do not use caches for inter-job transfer or release provenance.
- Keep the existing required contexts during dual-run. Cut over rulesets only after the new AppVeyor context and producer have appeared successfully on recent commits, and retain a rollback window.
- Separate CI migration from release migration. Evaluate AppVeyor environment deployment only after CI parity, artifact provenance, approval, and credential boundaries are demonstrated.
- Do not translate GitHub Actions YAML mechanically. Map each gate's observable contract to AppVeyor's clone/install/build/test/artifact/finalization phases and document every unsupported semantic.

## Management CLI finding

AppVeyor does not publish an official general-purpose account-management CLI;
its official `appveyor` build-worker executable controls the current worker.
The migration workstation therefore uses the independently maintained,
MIT-licensed `jrgcubano/appveyor-cli` 0.2.1, installed as
`/Users/mikserek/.cargo/bin/appveyor` from its macOS arm64 release after checking
SHA-256 `a84382f8ca24c4c2838b40d1e03a1778ada99f0afe4b895ac167c1233cef58ef`.
No API token is stored in its plaintext user configuration. Account mutation
remains unavailable until an administrator supplies an environment-backed API
token.

## Official sources

### AppVeyor

- [Welcome and GitHub repository onboarding](https://www.appveyor.com/docs/)
- [Build configuration, pipeline, matrices, UI-only settings, schedules, and limits](https://www.appveyor.com/docs/build-configuration/)
- [`appveyor.yml` reference](https://www.appveyor.com/docs/appveyor-yml/)
- [Build environments and worker images](https://www.appveyor.com/docs/build-environment/)
- [Linux builds and Docker service](https://www.appveyor.com/docs/getting-started-with-appveyor-for-linux/)
- [Build artifacts](https://www.appveyor.com/docs/packaging-artifacts/)
- [Build cache](https://www.appveyor.com/docs/build-cache/)
- [Secure files](https://www.appveyor.com/docs/how-to/secure-files/)
- [Deployment modes and conditions](https://www.appveyor.com/docs/deployment/)
- [GitHub Releases deployment provider](https://www.appveyor.com/docs/deployment/github/)
- [BYOC workers](https://www.appveyor.com/docs/byoc/)
- [Pricing](https://www.appveyor.com/pricing/)

### GitHub

- [About using GitHub Apps](https://docs.github.com/en/apps/using-github-apps/about-using-github-apps)
- [Choosing GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
- [Status checks](https://docs.github.com/en/pull-requests/reference/status-checks)
- [Protected branches and required checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [GitHub Container Registry authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [OpenID Connect in GitHub Actions](https://docs.github.com/en/actions/concepts/security/openid-connect)

### Community tooling

- [`jrgcubano/appveyor-cli` repository and releases](https://github.com/jrgcubano/appveyor-cli)

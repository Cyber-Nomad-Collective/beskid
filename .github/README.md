# Workflows in this repository

This repo is an **aggregate** (submodules and shared web tooling). CI is centralized here and runs on **Blacksmith / GitHub-hosted runners via `scripts/ci/*.sh`** — Dagger is no longer in the gate or publish paths.

## Active workflows (`.github/workflows/`)

| Workflow | Purpose |
|----------|---------|
| `platform-delivery.yml` | OpenSpec/conformance/integration/shared-ui-nexus/security quality checks, private-registry image publication, manifest evidence, and production Watchtower verification |
| `corelib.yml` | Corelib quality + test (native) + pckg publish |
| `compiler.yml` | Compiler Rust gate, LSP contract, CLI/LSP releases (native per-OS matrix) |
| `distribute.yml` | Ecosystem distribution of compiler release artifacts |
| `publish-open-vsx.yml` | VS Code extension to Open VSX (native OS-runner matrix) |
| `compiler-gate-testbox.yml` | Compiler gate on a Blacksmith Testbox (`workflow_dispatch` / PR) |

## Platform delivery contract

The platform has one publisher and one promotion path. Reusable workflows are
implementation details of `platform-delivery.yml`, not alternate entry points:

| Workflow | Contract |
|----------|----------|
| `reusable-quality.yml` | One blocking, branch-protection-friendly quality gate with retained JUnit evidence |
| `reusable-image.yml` | Private-registry image build with immutable SHA audit tags, the controlled `production` tag, SBOM, provenance, and keyless signing |
| `reusable-release-manifest.yml` | Aggregate image digests into one checksummed release manifest |
| `reusable-promote.yml` | Verify the manifest source, wait for Watchtower’s production update, and smoke public endpoints |

PRs run all gates and build images without pushing. On `main`, every required
image lane publishes an immutable `sha-<commit>` audit tag and advances only its
own `production` tag in `cr.beskid-lang.org`. The host Watchtower polls those
controlled tags every minute and restarts only explicitly labelled application
services. There is no staging lane and CI does not call a deployment API.


Branch protection (not the workflow graph) is the place to make any quality gate
mandatory for merge; delivery itself intentionally never waits on them.

Set repository secrets `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` with push
access to `cr.beskid-lang.org`. A missing or rejected registry credential fails
the image lane; no image falls back to GHCR.

Required environment configuration:

| Name | Kind | Purpose |
|------|------|---------|
| `REGISTRY_USERNAME` | repository secret | Private-registry push account |
| `REGISTRY_PASSWORD` | repository secret | Private-registry push credential |
| `BESKID_SMOKE_URLS` | optional repository variable | Exact newline-separated production health endpoints |

Production host access is intentionally outside CI. The host keeps Compose,
registry credentials, and OpenBao-derived runtime secrets; CI may only publish
the controlled image tags. Direct host changes use `beskid_sites/deploy/deploy.sh`.
  Private packages resolve via workspace file: links — no GitHub Packages auth needed.
GitHub's token is used only as the public-repository fallback.

Every manifest records the source commit and workflow identity. The immutable
SHA tags remain the audit and rollback references for each mutable production
tag.

Replacement validation is **script-first** — see [`scripts/ci/`](../scripts/ci/) and [`scripts/README.md`](../scripts/README.md).

**Compiler releases:** `compiler.yml` remains the authoritative compiler/LSP
test workflow. The separate `compiler-release.yml` consumes its completed run:
a successful gate selects stable, while any non-successful automatic run selects
unstable. Stable requires all native platform CLI/LSP/bundle builds; unstable
publishes when at least one platform produces both CLI and LSP and records all
test/build failures in `release-state.json` and the release notes. Set repo
secret `COMPILER_RELEASE_TOKEN` (or reuse `COMPILER_SUBMODULE_TOKEN`) with
`contents: write` on `beskid_compiler`.

Compiler, LSP, Corelib, and release build gates retain raw logs plus structured
failure JSON. GitHub summaries and annotations include component, stage,
platform, command, an emitted/derivable qualified identifier when available,
source path and line/column, and a concise reason. An unavailable identifier is
reported explicitly; opaque compiler node keys are preserved as evidence and
are not presented as human-readable symbols.

The docs site prebuild still reads the rolling `cli-stable` release. Audit the
download site and other version consumers only after this release workflow has
passed on GitHub Actions.

## Local validation

- **Web / docs (aggregate):** `./validate-ci-local.sh`
- **Gates:** the `scripts/ci/*-gate.sh` scripts run anywhere the toolchain is installed (run directly or on a Testbox)
- **Compose:** `env BESKID_ENV_FILE=.env.example docker compose -f beskid_sites/deploy/docker-compose.yml config --quiet`
- **Replacement CI/CD contracts:** `bash scripts/ci/test/run-cicd-foundation-tests.sh`

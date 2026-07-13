# Workflows in this repository

This repo is an **aggregate** (submodules and shared web tooling). CI is centralized here and runs on **Blacksmith / GitHub-hosted runners via `scripts/ci/*.sh`** — Dagger is no longer in the gate or publish paths.

## Active workflows (`.github/workflows/`)

| Workflow | Purpose |
|----------|---------|
| `platform-delivery.yml` | Authoritative OpenSpec/conformance/integration/security gates, build-once images, manifest, staging |
| `promote-production.yml` | Protected production promotion of a successful main delivery manifest |
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
| `reusable-image.yml` | SHA-tagged image build with BuildKit-secret package auth, SBOM, provenance, and keyless signing |
| `reusable-release-manifest.yml` | Aggregate image digests into one checksummed release manifest |
| `reusable-promote.yml` | Render exact image digests and plan or deploy through protected `staging` / `production` environments |

PRs run all gates and build images without pushing. A successful `main` run
publishes signed SHA images, creates one checksummed digest manifest, and deploys
that manifest to staging. Production accepts only a successful main delivery run
ID and promotes its existing manifest after the protected environment approval.

Required environment configuration:

| Name | Kind | Purpose |
|------|------|---------|
| `COOLIFY_ENDPOINT` | variable | Lane Coolify API endpoint |
| `COOLIFY_SERVICE_UUID` | variable | Lane-specific Compose service |
| `BESKID_SMOKE_URLS` | variable | Newline-separated internal/public health endpoints |
| `OPENBAO_ADDR` | variable | Lane OpenBao endpoint |
| `COOLIFY_API_TOKEN` | environment secret | Lane-scoped API credential |
| `OPENBAO_TOKEN` | environment secret | Read-only token for the lane KV prefix |

Production must use required reviewers. Environment credentials must be distinct;
preview/PR jobs receive neither. Direct mutable-tag Compose deployment is rejected.
Private package installs also require the repository `NODE_AUTH_TOKEN` secret;
GitHub's token is used only as the public-repository fallback.

Every manifest records the source commit and workflow identity. Promotion emits
a deterministic W3C `traceparent` plus manifest SHA so CI logs, Coolify requests,
runtime telemetry, and rollback evidence can be correlated.

Replacement validation is **script-first** — see [`scripts/ci/`](../scripts/ci/) and [`scripts/README.md`](../scripts/README.md).

**Compiler releases:** set repo secret `COMPILER_RELEASE_TOKEN` (or reuse `COMPILER_SUBMODULE_TOKEN`) with `contents: write` on `beskid_compiler`. The docs site prebuild runs `sync:cli-version` against the rolling `cli-latest` release (see `site/website` / trudoc).

## Local validation

- **Web / docs (aggregate):** `./validate-ci-local.sh`
- **Gates:** the `scripts/ci/*-gate.sh` scripts run anywhere the toolchain is installed (run directly or on a Testbox)
- **Compose:** `cd beskid_infra && just compose-config`
- **Replacement CI/CD contracts:** `bash scripts/ci/test/run-cicd-foundation-tests.sh`

# Superrepo scripts

## Toolchain

[`install-deps.sh`](install-deps.sh) reads [`repo-deps.json`](../repo-deps.json) and installs/checks CLIs (groups: `infra`, `beskid`, `ops`). Libraries: [`lib/`](lib/).

```bash
./scripts/install-deps.sh --check
./scripts/install-deps.sh --install -y --group beskid
```

## Checkout

[`setup-environment.sh`](setup-environment.sh) — submodules + root `pnpm install` (see [`../README.md`](../README.md)).

## CI (`scripts/ci/`)

Submodule init + native gates/publish lanes that run directly on Blacksmith
runners (the compiler gate is also Testbox-compatible). Dagger is retired.

| Script | Used by |
|--------|---------|
| [`init-submodules.sh`](ci/init-submodules.sh) | GHCR / release / Open VSX / platform matrix checkouts |
| [`init-compiler-submodule.sh`](ci/init-compiler-submodule.sh) | Compiler + corelib (tags for semver) |
| [`compiler-rust-gate.sh`](ci/compiler-rust-gate.sh) | Compiler Rust gate (clippy + workspace tests) |
| [`lsp-command-contract-gate.sh`](ci/lsp-command-contract-gate.sh) | LSP + VS Code command-contract gate |
| [`corelib-gate.sh`](ci/corelib-gate.sh) | Corelib quality + `beskid test` |
| [`platform-smoke.sh`](ci/platform-smoke.sh) | Aggregate web-workspace smoke |
| [`site-build-gate.sh`](ci/site-build-gate.sh) | Auth / canonical website build gate |
| [`vscode-gate.sh`](ci/vscode-gate.sh) | VS Code extension `pnpm test` |
| [`verify-frozen-lockfile.sh`](ci/verify-frozen-lockfile.sh) | Per-directory `pnpm install --frozen-lockfile` |
| [`compute-cli-version.sh`](ci/compute-cli-version.sh) | Compiler-minted global `0.4.<build>` version |
| [`build-release-artifact.sh`](ci/build-release-artifact.sh) | Native CLI/LSP release build |
| [`publish-release-stream.sh`](ci/publish-release-stream.sh) | `gh release` for `cli-*` / `lsp-*` streams |
| [`build-release-platform.sh`](ci/build-release-platform.sh) | Independent native CLI/LSP/bundle build with retained logs and structured failures |
| [`build-release-state.sh`](ci/build-release-state.sh) | Stable/unstable publication eligibility and machine-readable release state |
| [`render-compiler-release-notes.sh`](ci/render-compiler-release-notes.sh) | Human-readable GitHub release notes generated from release state |
| [`run-ci-reported-command.sh`](ci/run-ci-reported-command.sh) | GitHub annotations, summaries, raw logs, and JSON for failed gate commands |
| [`corelib-publish.sh`](ci/corelib-publish.sh) | Pack and publish the production corelib closure plus all first-party templates to pckg (`--dry-run` validates every artifact without secrets or registry mutation) |
| [`open-vsx-publish.sh`](ci/open-vsx-publish.sh) | Open VSX publish (native) |
| [`build-release-manifest.sh`](ci/build-release-manifest.sh) | Aggregate immutable OCI image records into a release manifest |
| [`validate-release-manifest.sh`](ci/validate-release-manifest.sh) | Enforce digest, SBOM, provenance, and source-commit policy |
| [`post-deploy-smoke.sh`](ci/post-deploy-smoke.sh) | Retry production public endpoints while Watchtower converges |
| [`sign-image.sh`](ci/sign-image.sh) | Required keyless cosign signing for promotable images |
| [`prepare-secure-dockerfile.sh`](ci/prepare-secure-dockerfile.sh) | Convert package-token ARGs to BuildKit secret mounts at build time |
| [`openspec-gate.sh`](ci/openspec-gate.sh) | Strict OpenSpec authority validation |
| [`conformance-gate.sh`](ci/conformance-gate.sh) | Requirement/provenance conformance validation |
| [`platform-integration-gate.sh`](ci/platform-integration-gate.sh) | Cross-site delivery integration contract |
| [`shared-ui-nexus-gate.sh`](ci/shared-ui-nexus-gate.sh) | Shared UI Vitest + Nexus unit/Playwright E2E |
| [`security-policy-gate.sh`](ci/security-policy-gate.sh) | Offline workflow and supply-chain policy |

## Lazygit

[`lazygit/config.yml`](lazygit/config.yml) — recursive commit/push via [`git-commit-push-recursive.sh`](git-commit-push-recursive.sh) (lazygit only; not a standalone workflow).

## Local CI

[`../validate-ci-local.sh`](../validate-ci-local.sh) runs the same integration,
shared-ui/Nexus, OpenSpec, conformance, and supply-chain policy used by
platform delivery. Shared UI + Nexus command parity:
[`../docs/orchestrate/shared-ui-nexus-gate.md`](../docs/orchestrate/shared-ui-nexus-gate.md).

Replacement delivery contracts run without external state changes:

```bash
bash scripts/ci/test/run-cicd-foundation-tests.sh
```

The foundation suite also runs the component license-policy guard. Run it
directly after adding or moving a package:

```bash
pnpm licenses:check
```

The declared boundaries live in `license-policy.json`; the human-readable
policy and third-party exceptions live in `LICENSING.md`.

## Interactive setup

[`../site/setup-wizard.sh`](../site/setup-wizard.sh) — `just setup` from repo root.

# AppVeyor CI and Watchtower Delivery Boundary

**Date:** 2026-09-09
**Status:** Approved for implementation by the repository owner

## Objective

Move Beskid's general validation and platform-image publication from GitHub
Actions and Blacksmith to one repository-owned AppVeyor pipeline. Publish the
five platform service images only to `cr.beskid-lang.org`. Watchtower remains
the only component permitted to reconcile those images into production.

GitHub Actions remains only where GitHub is the natural authority: GitHub
Release publication, distribution publication, editor-marketplace publication,
and repository-integrated security facilities. Retained workflows must not
duplicate AppVeyor validation or publish platform service images.

## Authority model

| Concern | Authority | Contract |
|---|---|---|
| Pull-request and main validation | AppVeyor | Runs repository scripts on native Linux, macOS, and Windows workers. |
| Platform image publication | AppVeyor | Main-branch Linux publish lane pushes immutable commit and mutable `production` tags to `cr.beskid-lang.org/beskid/*`. |
| Production reconciliation | Watchtower | Observes controlled `production` tags and updates services independently of CI. |
| Native releases and distribution | GitHub | Explicitly dispatched GitHub-native workflows publish GitHub Releases and downstream packages. |
| Security scanning and repository policy | GitHub | Native security products and repository rules stay close to their source of truth. |

AppVeyor has registry credentials but no production-host, Compose, Coolify, or
Watchtower-control credentials. A successful AppVeyor run means validation and,
on `main`, publication succeeded. It does not claim that production converged.

## Pipeline design

The root `appveyor.yml` is orchestration only. It selects one lane per native
worker and invokes canonical scripts under `scripts/ci/`; build behavior is not
duplicated in provider-specific YAML.

The initial matrix contains:

- `linux-platform`: OpenSpec, integration, security, shared UI, Corelib, site,
  Tracker, and image-build gates; on a trusted `main` push it publishes the five
  platform images.
- `linux-compiler`: compiler and Linux ABI-v5 runtime-kit validation.
- `macos-compiler`: compiler-relevant macOS ABI-v5 runtime-kit validation.
- `windows-compiler`: compiler-relevant Windows ABI-v5 runtime-kit validation.

Every job starts from pinned submodule commits and installs its toolchain through
repository scripts. AppVeyor cache entries are performance-only and never carry
release evidence between jobs. Project-level `max_jobs: 1` makes AppVeyor's FIFO
queue the release sequencer: compiler members and separate builds run one at a
time, preventing an older build from advancing mutable tags after a newer build.
This release-order guarantee deliberately lengthens end-to-end builds.

## Image identity and publication

The active platform lanes are `site`, `learn`, `tracker`, `nexus`, and `pckg`.
Each build produces:

- `cr.beskid-lang.org/beskid/<lane>:sha-<full-git-sha>` as the immutable identity;
- `cr.beskid-lang.org/beskid/<lane>:production` only after the lane's validation
  and image build succeed on a trusted `main` push.

Pull requests, tags, forks, and non-main branches never receive registry
credentials and never push. Publisher and promoter login from
environment-provided credentials through separate restrictive temporary Docker
configurations. The publisher logs out before live package publication. After
that publication succeeds, AppVeyor finalizes the five immutable digest records
before starting mutable promotion, so a promoter or promoter-cleanup failure
cannot remove the evidence needed for artifact upload. Each registry script
removes its configuration; logout or removal failure fails an otherwise
successful script, while cleanup never replaces an earlier failure. Missing
registry credentials fail the main publish lane closed. One sourced production
library defines the registry, namespace, five lanes, and immutable/production
refs consumed by the publisher, promoter, and manifest.

The current implementation publishes lanes independently inside one
`linux-platform` job so no mutable production tag appears until all platform
quality gates have passed. Watchtower remains asynchronous; public production
health is an operator/deployment observation rather than a CI deployment step.

## GitHub workflow reduction

Delete the GitHub validation and platform-delivery workflows, their Blacksmith
handoff, and reusable platform image/promotion workflows. Retain GitHub-native
publication workflows. The compiler release workflow becomes explicit
`workflow_dispatch` only; AppVeyor must not depend on a broad GitHub token merely
to manufacture an automatic release. This is intentionally a manual release
boundary until a least-privilege dispatch credential is configured and proved.

## Security and failure behavior

- AppVeyor PR builds receive no secure variables and cannot publish or deploy.
- The pipeline rejects a publish attempt unless AppVeyor identifies `main`, a
  push event, and a non-pull-request build.
- Registry values are never committed or written to CLI configuration.
- No workflow suppresses a failed gate, image build, login, or push.
- Native jobs are required matrix members; no lane is allowed to fail.
- Provider/account facts that cannot be read without an AppVeyor API token are
  recorded as activation checks, never guessed.

## Deleted legacy paths

- GitHub Actions validation for Compiler, Corelib, Tracker, OpenSpec, websites,
  and platform integration.
- GitHub Actions platform-image build, manifest, promotion, Coolify staging,
  production approval, and Watchtower polling orchestration.
- Blacksmith/Testbox compiler handoff workflows.
- GHCR as the platform service-image publication destination.

GitHub-native releases and the separate compiler/distribution container products
are outside the five platform service images and remain explicitly dispatched.

## Activation checks and consolidated questions

No answer is required to complete the repository migration. These are the only
account-side facts an administrator must confirm before treating AppVeyor as a
live required/publishing authority:

1. Which AppVeyor account and project own the existing GitHub webhook, and is
   repository YAML selected as its configuration source?
2. Which current hosted or BYOC images correspond to the requested Ubuntu,
   macOS arm64, and Windows workers for this account?
3. What exact commit-status context and GitHub App identity does the project
   emit, and should it become a required rule after one real green build?
4. Are `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, and
   `BESKID_PCKG_API_KEY` configured as secure AppVeyor variables with
   pull-request access disabled?
5. Does a live queue proof confirm release-safe FIFO ordering with
   `max_jobs: 1`, and does every hosted job—including the complete platform
   lane—fit its documented 60-minute per-job budget, or should the affected job
   move to a private/BYOC worker?
6. What retention policy is required for AppVeyor logs/artifacts and private
   registry immutable `sha-*` tags?

If any answer fails closed, validation may still run, but the corresponding
required-check or image-publication activation must wait.

## Rollback

Repository rollback is one commit that restores the prior workflows and removes
`appveyor.yml`. Operational rollback is independent: Watchtower can be paused
and the previous immutable `sha-*` tag selected by the production operator.
AppVeyor never owns that action.

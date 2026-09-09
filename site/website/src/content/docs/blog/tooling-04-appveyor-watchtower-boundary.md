---
title: "CI Is Moving to AppVeyor. Deployment Is Staying with Watchtower."
description: "September 2026. Beskid is moving platform CI from GitHub Actions and Blacksmith to AppVeyor, publishing images to cr.beskid-lang.org, and drawing a sharper boundary: CI publishes; Watchtower deploys."
date: 2026-09-09
blogStatus: released
release: Tooling
---

CI systems have a bad habit of becoming operating systems written in YAML. The syntax looks declarative until a runner image changes, a billing boundary appears, or an undocumented platform default quietly becomes part of the build. Then the YAML is not configuration. It is a distributed program with poor tooling and an unusually cheerful failure mode.

Beskid has therefore moved its repository CI configuration from GitHub Actions and Blacksmith to AppVeyor. This is not a claim that every account-side worker and credential is already proven everywhere. The repository boundary is deliberately narrow: AppVeyor runs the platform build and publish work; platform images publish to `cr.beskid-lang.org`; Watchtower alone applies those published images to production.

GitHub is not leaving the project. During the initial migration it remains responsible for GitHub-native work: releases, repository-integrated security functions, and the features that are genuinely inseparable from GitHub. The point is to stop treating that boundary as an excuse to route every build and deployment concern through the same hosted workflow product.

## The boundary: publish is not deploy

The operational change is intentionally plain:

1. AppVeyor builds and verifies a platform image.
2. A successful publish makes that image available at `cr.beskid-lang.org`.
3. Watchtower observes the controlled production tags and reconciles the running service to the published image.
4. Operators verify convergence through Watchtower status and public health evidence; CI does not start, replace, or roll back production containers.

That last line matters. A build system having registry credentials does not make it a deployment controller. Mixing those roles produced a familiar kind of ambiguity: the run was green, but which system was actually allowed to change production? The answer now has one subject. Watchtower deploys. CI publishes and reports on what it published.

This is not a magic reliability switch. Watchtower introduces its own trade-offs: reconciliation is asynchronous, rollout observation needs explicit health evidence, and a bad published tag can still be observed quickly. Those are useful constraints because they are visible constraints. The deployment mechanism is one service with one job, rather than an accumulation of workflow permissions, callbacks, and runner-side assumptions.

## Why move the CI work

GitHub Actions and Blacksmith served real needs, especially for GitHub-integrated release and security work. But the general build path accumulated coupling that was easy to normalize and hard to reason about. Runner labels, action behavior, cache semantics, billing and concurrency limits, and platform-specific setup all lived alongside the build definition. Each individual choice was defensible. Together they made the build's actual environment harder to reproduce than its YAML suggested.

The problem is not that YAML is incapable of expressing a build. YAML is perfectly capable of expressing a great many decisions that no one realizes they have delegated to a hosted platform. That is an impressive trick, just not the kind of magic we want around release artifacts.

AppVeyor gives the migration a separate worker and build boundary. It does not automatically make builds portable, faster, cheaper, or correct. Those properties must be measured in Beskid's actual lanes, with the actual toolchains and artifacts. The value of the move is that it makes the worker contract something we can test directly instead of an incidental property of an Actions job plus a runner marketplace integration.

## What AppVeyor has to prove

This is an initial migration, not a ceremonial rename of CI providers. AppVeyor must prove native worker and build parity before it becomes the authority for each platform lane.

Parity means more than receiving a green status:

- The required operating-system and architecture lanes must build with the same pinned inputs and produce the expected artifacts.
- Compiler, package, and site gates must retain their real failure behavior, including logs and exit codes that an engineer can act on.
- Registry publication must produce the intended `cr.beskid-lang.org` image references and the evidence required by the release process.
- The worker environment must handle the repository's submodules, native dependencies, caches, and resource demands without relying on undocumented host state.
- Watchtower reconciliation and public smoke checks must demonstrate that a published platform image reaches the correct service without CI acquiring container-control authority.

Until those conditions are met for a lane, the migration is incomplete for that lane. A new dashboard with a green badge is not parity. It is just a new place to look while the old assumptions remain untested.

## What GitHub still owns

Keeping GitHub for GitHub-native release and security functions is a trade-off, not an ideological purity test. GitHub Releases, repository events, security advisories, and related controls belong close to the repository system that owns them. Replacing them merely to say everything moved would create extra integrations without reducing the actual risk.

The migration instead separates concerns where the separation is meaningful. AppVeyor owns the platform build-and-publish path. The private registry owns published images. Watchtower owns production reconciliation. GitHub retains the operations for which GitHub is the natural system of record. The seams are explicit, which is more valuable than pretending there are no seams.

## The standard is boring evidence

The goal is not to replace one CI brand with another. The goal is a pipeline that can be described without a footnote about which hidden runner behavior made it pass last Tuesday.

That requires evidence: reproducible worker builds, published image identities, observable Watchtower convergence, and release or security actions that remain where their source of truth lives. If AppVeyor cannot meet that standard, it has not earned the migration. If it can, the result is not glamorous. It is a platform delivery path with fewer accidental authorities and a deployment boundary that says exactly who is allowed to deploy.

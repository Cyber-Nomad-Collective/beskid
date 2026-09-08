---
title: Beskid Licensing
description: Identify the license that applies to a Beskid component, service, document, or output.
pageKind: reference
diagramPolicy: not-needed
diagramOmissionReason: The component license matrix is clearer than a relationship diagram.
audience:
  - evaluator
  - contributor
  - service operator
authority:
  status: informative
  sourceLabel: Pinned Beskid licensing policy
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/LICENSING.md
  limits: This page summarizes repository policy and is not legal advice. Local licenses and third-party terms can be more specific.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

Start with the component path. A more specific license or package declaration overrides the repository default. Third-party code keeps its original terms and notices.

## Scope

Identify the component path and whether it has a more specific license. Record all third-party code and assets in the distribution.

This page summarizes repository policy. It is not legal advice, and it does not replace a local license or third-party notice.

## Authority

Read the exact boundary in [`LICENSING.md`](https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/LICENSING.md). A local license, package declaration, or third-party notice can set a more specific boundary for its content.

Run `pnpm licenses:check` from the repository root after a package or path change. The selected component must have its Apache-2.0, AGPL-3.0-only, CC-BY-4.0, or third-party declaration. A distribution must include all required texts and notices.

| Scope | Policy summary |
| --- | --- |
| Language, compiler, tooling, reusable code, templates, core library, and runtime | `Apache-2.0`. Using the compiler does not by itself change the license of compiled programs. |
| Beskid-owned network-service application code | `AGPL-3.0-only`. An operator who modifies a covered service and lets users interact with it over a network must offer the required Corresponding Source. |
| Documentation prose | `CC-BY-4.0`, unless the file says otherwise. Code examples remain `Apache-2.0` unless marked otherwise. |
| Nexus inherited implementation | PolyForm Noncommercial License 1.0.0 and the required upstream notice. This exception is not AGPL. |
| Brand assets and marks | No trademark permission comes from the software or documentation licenses. |

## Report a mismatch

If a third-party notice or license is missing, do not distribute the artifact. Use [Report a bug](/docs/platform/report-bug/) to identify the component path, declared license, conflicting source, and verification revision. Keep the artifact undistributed until the source owner restores the notice or approves removal of the affected material. Ask qualified counsel when the policy does not resolve a legal question.

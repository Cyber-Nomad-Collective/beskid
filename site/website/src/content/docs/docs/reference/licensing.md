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

## Prerequisites

Identify the component path and whether it has a more specific license. Record all third-party code and assets in the distribution.

## Actions

1. Read the exact boundary in [`LICENSING.md`](https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/LICENSING.md).
2. Inspect local license files, package metadata, and third-party notices for the selected component.
3. Run `pnpm licenses:check` from the repository root after a package or path change.

| Scope | Policy summary |
| --- | --- |
| Language, compiler, tooling, reusable code, templates, core library, and runtime | `Apache-2.0`. Using the compiler does not by itself change the license of compiled programs. |
| Beskid-owned network-service application code | `AGPL-3.0-only`. An operator who modifies a covered service and lets users interact with it over a network must offer the required Corresponding Source. |
| Documentation prose | `CC-BY-4.0`, unless the file says otherwise. Code examples remain `Apache-2.0` unless marked otherwise. |
| Nexus inherited implementation | PolyForm Noncommercial License 1.0.0 and the required upstream notice. This exception is not AGPL. |
| Brand assets and marks | No trademark permission comes from the software or documentation licenses. |

## Expected result

The component has its correct Apache-2.0, AGPL-3.0-only, CC-BY-4.0, or third-party declaration. The distribution includes all required texts and notices.

## Recovery

If a third-party notice or license is missing, do not distribute the artifact. Restore the notice or remove the affected material with the source owner's approval. Ask qualified counsel when the policy does not resolve a legal question.

## Next task

[Use the reference map](/docs/reference/) or [review service operation](/docs/services/).

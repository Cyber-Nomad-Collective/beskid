---
title: Change the Beskid Standard
description: Propose, validate, and publish a normative behavior change through OpenSpec.
audience:
  - specification contributor
  - maintainer
authority:
  status: normative
  sourceLabel: Pinned OpenSpec configuration
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/openspec/config.yaml
  limits: This page explains the workflow. Accepted files in openspec/specs remain the sole normative text.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

OpenSpec is the sole normative authority. Docs are informative and must not create a second requirement.

## Prerequisites

Describe the observable behavior that must change. Identify the stable capability identifier and existing requirements that the change affects.

## Actions

1. Create an OpenSpec change with a proposal, design when needed, tasks, and a capability delta.
2. Write each normative requirement with `SHALL or MUST`. Give every scenario `GIVEN, WHEN, and THEN` conditions.
3. Run `openspec validate <change-id> --strict --no-interactive` for the selected change.
4. Run `pnpm run openspec:validate` from the repository root.
5. Regenerate `openspec/catalog.json` only when the owning change requires the deterministic projection.

```mermaid
flowchart LR
  accTitle: OpenSpec authority and publication flow
  accDescr: A contributor validates an OpenSpec change. Accepted requirements enter the canonical specification. The catalog projects identifiers. Docs then link to that authority.
  C[OpenSpec change] --> V[Strict validation]
  V --> S[Canonical specification]
  S --> K[Catalog projection]
  K --> D[Docs summary]
```

### Diagram text

| Stage | Result |
| --- | --- |
| OpenSpec change | The proposal identifies scope and the capability delta contains each proposed requirement. |
| Strict validation | Every `SHALL` or `MUST` rule and every `GIVEN`, `WHEN`, and `THEN` scenario passes validation. |
| Canonical specification | Accepted files under `openspec/specs/` become the normative source. |
| Catalog projection | `openspec/catalog.json` publishes stable identifiers and source relationships. |
| Docs summary | The informative Docs explain a task and link to the canonical requirement. |

## Expected result

Validation accepts complete `SHALL or MUST` requirements and `GIVEN, WHEN, and THEN` scenarios. The catalog keeps stable identifiers for the accepted source.

## Recovery

If strict validation reports a validation error, correct the OpenSpec change and run the focused command again; do not change Docs to hide a normative conflict. If a generated catalog differs unexpectedly, stop and inspect the source change and generator revision.

## Next task

[Write the public technical guidance](/docs/contributing/documentation/).

---
title: Reference Map
description: Select the canonical source for behavior, procedure, delivery, or licensing facts.
audience:
  - evaluator
  - developer
  - maintainer
authority:
  status: informative
  sourceLabel: Complete public Docs design
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/docs/superpowers/specs/2026-09-08-complete-public-docs-design.md
  limits: This page identifies authorities. It does not replace them.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

Use the authority that matches the fact. Record its verification revision when the fact can change.

## Prerequisites

State the fact to verify. Classify its authority type as behavior, procedure, command, learning, delivery, service operation, or licensing.

## Actions

1. Use the [Beskid Standard](/docs/standard/) for required language and tool behavior.
2. Use task Docs for current procedures and the Book for learning sequence and rationale.
3. Use Tracker for delivery status and [Licensing](/docs/reference/licensing/) for component terms.

| Information | Canonical source |
| --- | --- |
| Required behavior | OpenSpec and the public Standard. |
| Current procedure | Technical Docs. |
| Command syntax | Pinned CLI evidence and the command reference. |
| Learning rationale | The Beskid Book. |
| Delivery status | Tracker and release metadata. |
| Service operation | Service and infrastructure contracts. |
| License boundary | `LICENSING.md` and local license declarations. |

## Expected result

You have one canonical source and its verification revision. An informative page links to the authority instead of duplicating its rule.

## Recovery

If two sources conflict, do not infer a new rule. Report the conflicting sources to their owners. Use an OpenSpec change for normative reconciliation.

## Next task

[Review component licensing](/docs/reference/licensing/).

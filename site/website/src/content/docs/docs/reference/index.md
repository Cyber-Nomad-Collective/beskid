---
title: Reference Map
description: Select the canonical source for behavior, procedure, delivery, or licensing facts.
pageKind: reference
diagramPolicy: not-needed
diagramOmissionReason: The authority table is clearer than a flow diagram for reference selection.
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

## Scope

State the fact to verify. Classify its authority type as behavior, procedure, command, learning, delivery, service operation, or licensing.

This reference map covers source selection. It does not replace the selected source or define a new rule.

## Authority

Use the [Beskid Standard](/docs/standard/) for required language and tool behavior. Use task Docs for current procedures. Use the Book for learning sequence and rationale. Use Tracker for delivery status. Use [Licensing](/docs/reference/licensing/) for component terms.

| Information | Canonical source |
| --- | --- |
| Required behavior | OpenSpec and the public Standard. |
| Current procedure | Technical Docs. |
| Command syntax | Pinned CLI evidence and the command reference. |
| Learning rationale | The Beskid Book. |
| Delivery status | Tracker and release metadata. |
| Service operation | Service and infrastructure contracts. |
| License boundary | `LICENSING.md` and local license declarations. |

Use one canonical source and record its verification revision. An informative page links to the authority instead of duplicating its rule.

## Report a mismatch

If two sources conflict, do not infer a new rule. Use [Report a bug](/docs/platform/report-bug/) to record both source URLs, both revisions, and the conflicting statements. Use an [OpenSpec change](/docs/contributing/standard-changes/) only when normative reconciliation changes observable behavior.

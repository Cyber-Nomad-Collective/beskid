---
title: Contribute to Beskid
description: Select the repository, Standard, or documentation contribution procedure.
pageKind: guide
diagramPolicy: not-needed
diagramOmissionReason: The contributor task list is a short route to detailed procedures.
audience:
  - contributor
  - maintainer
authority:
  status: informative
  sourceLabel: Pinned superrepo contribution map
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/README.md
  limits: This page routes contribution tasks. Each source owner defines its focused gate.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

Select one authority and one ownership boundary before you edit a file.

## Prerequisites

Describe the repository change and its expected result. Identify the ownership boundary for the root repository or a submodule.

## Actions

1. Use [Repository setup](/docs/contributing/repository/) for a checkout, submodule, or test change.
2. Use [Standard changes](/docs/contributing/standard-changes/) before an observable behavior change.
3. Use [Documentation authoring](/docs/contributing/documentation/) for public technical guidance.

## Expected result

The change stays in the correct authority. Its focused gate passes, and the commit does not contain another owner's files.

## Recovery

If the diff contains unrelated changes, stop and preserve them without staging them. If ownership is unclear, contact the source owner before you edit the boundary.

## Next task

[Set up the repository](/docs/contributing/repository/).

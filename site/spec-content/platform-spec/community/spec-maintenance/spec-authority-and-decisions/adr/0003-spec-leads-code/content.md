---
title: Specification leads implementation
description: Observable behavior changes ship with normative spec updates; tests
  verify drift but do not replace missing contract text.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-AUTH-0003
adrStatus: Accepted
adrDate: 2026-05-21
lastReviewed: 2026-05-22
---

## Context

README intent and crate behavior diverged when implementation shipped without a matching platform-spec change set.

## Decision

Implementation that alters observable language or platform behavior **must** be preceded or accompanied by normative spec updates. The spec is the authority; tests and crates are verification anchors, not substitutes for missing contract text. Cross-cutting inception record: **D-INC-0001**.

## Consequences

Contributors pair spec and code in one change set; CI content gates block **Standard** stubs.

## Verification anchors

[Project inception ADR 0001](/platform-spec/community/project-inception/adr/0001-spec-leads-code/); `verify:platform-spec-content`.

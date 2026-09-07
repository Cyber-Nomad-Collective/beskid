---
title: "Spec-first workflow"
description: Observable behavior changes start in platform-spec, not in a surprise PR comment thread.
tableOfContents: true
---

**Spec leads code:** extend or update normative platform-spec text before (or in the same change set as) implementation that changes observable language or platform behavior.

## Practical rules

- Do not mark scaffold-only hubs as **Standard** to win an argument.
- Prefer updating existing feature hubs over spawning duplicate stubs.
- Run `openspec validate --all --strict` after platform-spec edits, then build the affected implementation and Book site.

## Read first

- [Specification authority and decisions](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/)
- [Release and versioning policy](/platform-spec/community/spec-maintenance/release-and-versioning-policy/)
- Chapters [12](/book/12-the-normative-bible/) and [13](/book/13-reading-the-law/)

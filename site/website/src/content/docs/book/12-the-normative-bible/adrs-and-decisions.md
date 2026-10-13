---
title: "ADRs and decisions"
description: Where accepted platform decisions live in the Standard and how they change.
tableOfContents: true
---

Long meetings deserve short records. Closed platform choices are recorded so the Standard is the argument archive, not Slack scrollback.

## Where they live

Accepted decisions are requirements in the capability that owns them, in `openspec/specs/<capability>/spec.md`. A decision requirement carries its decision identifier in its title, for example `Decision [D-COMP-SEM-0003]`, and a stable `BSP-REQ-...` identifier like every other requirement. New or changed decisions go through an OpenSpec change under `openspec/changes/` and are applied to `openspec/specs` when accepted.

Read the text of a decision in the linked OpenSpec source from its capability page; the Book does not restate it.

## Example topics you will see

- [Git version axis](/docs/standard/capabilities/community--spec-maintenance--release-and-versioning-policy/)
- [Spec leads code](/docs/standard/capabilities/community--spec-maintenance--spec-authority-and-decisions/)
- [Mod AOT-only registration](/docs/standard/capabilities/compiler--compiler-mods--mod-host-bridge/)

## Superseded

When a decision dies, an OpenSpec change modifies or removes the requirement and says what replaces it. Git history keeps the old text; no URL carries a hidden version.

## Next

[How to propose a change](/book/12-the-normative-bible/how-to-propose-a-change/)

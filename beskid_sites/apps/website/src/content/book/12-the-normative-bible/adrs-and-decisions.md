---
title: "ADRs and decisions"
description: Architecture decision records in platform-spec—one file per choice, ADRs tab in the reader.
tableOfContents: true
---

Long meetings deserve short records. **ADRs** capture closed platform choices so the spec reader's **ADRs** tab is the argument archive—not Slack scrollback.

## Where they live

```
platform-spec/<domain>/<area>/<feature>/adr/<slug>.mdx
```

Inception decisions: [Project inception](/platform-spec/community/project-inception/).

## File contract

Each ADR **must** include:

| Field / section | Purpose |
| --- | --- |
| `specLevel: adr` | Reader routing |
| `adrId` | Stable id (e.g. `D-CORE-CONC-0003`) |
| `adrStatus` | Accepted / Superseded / Proposed |
| `## Context` / `## Decision` / `## Consequences` | Actual content |

Hub **`## Decisions`** tables index `adrId` entries—avoid duplicating full prose only in `index.mdx` ([Spec authority](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/)).

## Example topics you will see

- [Git version axis](/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0001-git-version-axis/)
- [Spec leads code](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0003-spec-leads-code/)
- [Mod AOT-only registration](/platform-spec/compiler/compiler-mods/mod-host-bridge/adr/0003-mod-aot-only-registration/)

## Superseded

When a decision dies, mark **`adrStatus: Superseded`** and point to the replacement `adrId`—Git revision notes, not hidden URL versions.

## Next

[How to propose a change](/book/12-the-normative-bible/how-to-propose-a-change/)

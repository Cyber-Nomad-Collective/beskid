---
title: FAQ and troubleshooting
description: Common questions about Beskid templates and `beskid new`.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Purpose and scope

Operator and author FAQs.

## Why is there no `useCorelib: false`?

Host projects always receive **corelib** through toolchain resolution. Templates must not document or generate an opt-out; see [design model](./design-model/#corelib-policy).

## How do first-party templates ship?

Only as **`beskid.templates.*`** packages on **pckg**. The CLI downloads them when the registry is available; it does not embed stale copies when updates exist.

## Can I scaffold a compiler mod?

Yes. Template output may set `type: Mod` and include `project.mod { ... }` per [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/).

## Item vs project template?

| Kind | Command shape |
| --- | --- |
| Project | `beskid new console -o ./MyApp` |
| Item | `beskid new contract -o ./Src/File.bd --project ./MyApp` |
| Workspace | `beskid new workspace-demo -o ./MyWs` |

## Template build fails at template root

Expected: **`type: Template`** projects are not app compile targets. Run `beskid new` into a scratch folder to validate.

## Update message on every run

By design. Install with `beskid new install <package>` to refresh the cache.

## Yanked template still works

You received a **warning**. Prefer installing a non-yanked version; use `--allow-yanked` only when intentional.

## Placeholder left in file

**E1904** — a `{{symbol}}` was not bound. Pass `--symbol` or run interactive mode.

## pckg page shows no API docs for my template

Correct for `packageKind: template`. See [template packages](../template-packages/).

---
title: Contracts and edge cases
description: Publish-time and UI rules for template packages on pckg.
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

Registry validator and UI MUST rules.

## Publish validation

| ID | Rule |
| --- | --- |
| PK-T01 | When `packageKind` is **`template`**, validator **must not** require `.beskid/docs/api.json`. |
| PK-T02 | Validator **must** require `.beskid/template.json` with `schema: beskid.template.v1`. |
| PK-T03 | `Project.proj` **must** be present and **should** declare `type: Template` for author packages. |
| PK-T04 | `package.json` `id` **must** match `Project.proj` `name` (same rule as libraries). |
| PK-T05 | Versioning, checksum, forbidden paths, and yank semantics **must** match library packages. |

## Registry UI

| ID | Rule |
| --- | --- |
| PK-U01 | Package detail for `template` **must not** render API documentation components. |
| PK-U02 | Search and catalog **may** filter by `packageKind`. |
| PK-U03 | Dashboard publish flows **must** allow selecting template projects for pack. |

## Edge cases

- Upload library `.bpk` to template-only route — reject if `packageKind` mismatch when enforced server-side.
- Template package with `documentation.apiJson` in `package.json` — strip at publish or reject as invalid for template profile.
- **Yanked** template: catalog shows yank; `beskid new` warns per [project templates contracts](../project-templates/contracts-and-edge-cases/).

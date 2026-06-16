---
title: Verification and traceability
description: Tests, CI, and registry checks for template conformance.
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

How implementers prove template engine and first-party package compliance.

## Conformance matrix

| Requirement | Verification |
| --- | --- |
| `beskid.template.v1` parse | JSON schema fixture tests in `beskid_tests` |
| `{{ }}` exhaustion | Golden output diff tests |
| GUID rewrite | Multi-format guid fixture files in template content |
| corelib after instantiate | `beskid lock` + compile smoke without `noCorelib` manifest key |
| Update check on use | Mock registry returning newer semver → expect stdout message |
| Yanked warning | Publish yanked version → `beskid new` warns |
| Item template | Instantiate into temp project → `beskid analyze` |
| Workspace template | Two members resolve in `beskid tree` |

## First-party packages

| Package id | shortName | tags.type |
| --- | --- | --- |
| `beskid.templates.console` | `console` | `project` |
| `beskid.templates.lib` | `lib` | `project` |
| `beskid.templates.project` | `template` | `project` |

CI **must** pack and publish these under the **`beskid.templates.*`** namespace when registry credentials are available, matching [corelib publish](/platform-spec/core-library/compiler-integration/corelib-discovery-and-packaging/) workflow patterns.

## pckg server

- Template `.bpk` **must** reject `packageKind: library` when `template.json` present (or require `template`).
- Template package page **must not** mount API documentation viewer (see [template packages](../template-packages/verification-and-traceability/)).

## Spec drift

Changes to `beskid.template.v1` **must** update this article and [design model](./design-model/) in the same change set.

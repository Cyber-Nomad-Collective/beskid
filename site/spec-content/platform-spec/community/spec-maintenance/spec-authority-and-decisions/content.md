---
title: Specification authority and embedded decisions
description: Normative rules for language law vs implementation domains,
  maturity (Proposed/Standard), and embedded decision records in feature hubs
  and articles.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Normative platform contract

1. **Language law** — User-visible semantics (syntax, types, evaluation, contracts, memory, and cross-cutting language rules) **must** be defined only under the [Language meta](/platform-spec/language-meta/) domain, except where another domain page explicitly declares a **cross-domain exception** and links to the owning language-meta chapter.
2. **Implementation law** — The [Compiler](/platform-spec/compiler/), [Execution](/platform-spec/execution/), [Core library](/platform-spec/core-library/), and [Tooling](/platform-spec/tooling/) domains specify *how the reference platform realizes* language-meta. They **must not** redefine semantics already owned by language-meta; they **must** defer with `relatedTopics` (for example `defers-to`, `implements`) instead of duplicating normative key tables.
3. **Spec leads code** — Implementation changes that alter observable language or platform behavior **must** be preceded or accompanied by normative spec updates. The spec is the authority; tests and crates are verification anchors, not a substitute for missing contract text.
4. **Architecture decision records (ADRs)** — Each **Standard** feature **must** publish closed choices under **`adr/`** as one file per decision (`specLevel: adr`, stable `adrId`). The feature reader exposes an **ADRs** tab with expandable Context / Decision / Consequences detail. Legacy **`decisions-record.mdx`** articles and hub **`## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-AUTH-0001` … `D-COMM-AUTH-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-AUTH-0001` … `D-COMM-AUTH-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->`** summaries remain valid during migration but new work **must** use `adr/`. Cross-cutting inception decisions live under [Project inception](/platform-spec/community/project-inception/).

## Language law vs implementation domains

| Concern | Owning surface | Realization surfaces |
| --- | --- | --- |
| What programs mean (types, control flow, contracts) | language-meta | compiler phases, execution runtime |
| Author-facing manifests and CLI | tooling (authoring) | compiler resolution (graph, cycles) |
| Standard library API shape | core-library | execution syscalls, compiler lowering |
| Diagnostics users see | language-meta + compiler registry | tooling/LSP presentation |

When adding a feature, classify the topic **before** writing: if a reader asking “what does valid Beskid code mean?” would need the answer, it belongs in **language-meta** first; pipeline, crate, or host details belong in implementation domains with links back.

## Maturity — Proposed vs Standard

| `status` | Meaning | Requirements |
| --- | --- | --- |
| **Proposed** | Incomplete, unstable, or under active design | May omit full verification anchors; **must not** be cited as enforceable language law in conformance arguments |
| **Standard** | Enforceable platform contract | **Must** include normative MUST/SHOULD/MAY prose, verification anchors (tests, crates, or explicit registry links), and **`## Decisions`** on the feature hub (or a linked `decisions-record` article) |

Any **Standard** page that fails content gates (circular “canonical chapter” stubs, placeholder-only article bundles, missing decisions) **must** be downgraded to **Proposed** until restored.

## ADR file contract

Each ADR file at `platform-spec/<domain>/<area>/<feature>/adr/<slug>.mdx` **must** use:

| Field | Rule |
| --- | --- |
| `specLevel` | `adr` |
| `adrId` | Stable identifier (for example `D-INC-0001`, `D-CORE-CONC-0003`) |
| `adrStatus` | `Accepted`, `Superseded`, or `Proposed` |
| `adrDate` | ISO date when the decision closed (inception ADRs **should** reflect historical dates) |
| Body | **`## Context`**, **`## Decision`**, **`## Consequences`**; **`## Verification anchors`** when testable |

Superseded ADRs **must** set `supersedesAdr` or link the replacement `adrId` in **Consequences** and note the Git revision (not a URL version segment).

## Hub decisions summary

A **Standard** feature hub **must** include **`## Decisions`** that either lists open items or states **no open decisions** and links the **`adr/`** set (reader **ADRs** tab). Hub bullets **must not** duplicate full ADR prose—summarize and link by `adrId`.

## Related maintenance policies

- [Feature Hub + Article Bundle template](/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/) — Required hub sections, anti-stub rules, and article minimums.
- [Release and versioning policy](/platform-spec/community/spec-maintenance/release-and-versioning-policy/) — Git as version axis; v0.x delivery bands.
- [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/) — Legacy doc trees and mapping pages.

## Decisions
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->

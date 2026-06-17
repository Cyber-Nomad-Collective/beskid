---
title: Non-normative bridge docs policy
description: Policy for migration and bridge documents, including mandatory
  canonical destination links for non-normative mapping pages.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

## Normative platform contract

1. Bridge documents (migration guides, mapping tables, and terminology crosswalks) are **non-normative** by default unless a page explicitly declares normative status in a canonical platform-spec feature page.
2. Migration mapping pages **must not** be used as the final authority for platform behavior; they are transitional navigation aids.
3. Every non-normative bridge page **must** link to one or more canonical normative destination pages and clearly label those links as canonical.

## Required labeling for bridge docs

Each bridge document **must** state all of the following near the top of the page:

- That the page is non-normative.
- Why the page exists (for example, migration from legacy organization).
- Which canonical normative page(s) supersede or own the described behavior.

## Migration mapping page requirements

Migration mapping pages **must** include:

1. A one-sentence non-normative notice.
2. A "Canonical destinations" section that links to target Feature Hub and/or feature pages.
3. A "Mapping scope" section that states what is covered and what is intentionally excluded.
4. A maintenance note describing when the mapping can be retired.

When mappings span multiple domains or areas, pages **must** group links by destination domain/area so readers can reach canonical sources without interpretation.

## Canonical link quality rules

Canonical destination links **must** satisfy:

- Direct links to canonical platform-spec pages (not only intermediate redirects).
- Human-readable relation labels (for example, "Canonical feature contract").
- Bi-directional discoverability when practical (canonical pages should also link to major migration bridges during active transition windows).

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-BRIDGE-0001` … `D-COMM-BRIDGE-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->

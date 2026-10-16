---
title: "Git as version axis"
description: The Standard is versioned by commit, not by version segments in URLs.
tableOfContents: true
---

There is no `/docs/standard/v0.2/...` tree. The contract at commit **`abc123`** is whatever normative text exists in `openspec/specs` at **`abc123`**.

Policy: [Release and versioning policy](/docs/standard/capabilities/community--spec-maintenance--release-and-versioning-policy/).

## Stable identifiers, moving prose

- Capability pages like `/docs/standard/capabilities/language-meta--contracts-and-effects--contracts/` keep their address across releases. Requirements keep their stable `BSP-REQ-...` identifiers.
- Behavioral change edits the requirement text through an OpenSpec change, not the identifier.

## Rolling integration

`main` (or your integration branch) is the usual rolling axis for:

- Public docs site builds
- CLI `cli-stable` / `cli-unstable` rolling releases ([Downloads](/downloads/))
- Spec freshness via `lastReviewed` ([Last reviewed policy](/docs/standard/capabilities/community--spec-maintenance--last-reviewed-policy/))

## Single normative entry

The [Beskid Standard](/docs/standard/) is the **one** normative documentation tree. Legacy trees remain bridges, not parallel law ([Non-normative bridge docs](/docs/standard/capabilities/community--spec-maintenance--non-normative-bridge-docs-policy/)).

## Next

[ADRs and decisions](/book/12-the-normative-bible/adrs-and-decisions/)
